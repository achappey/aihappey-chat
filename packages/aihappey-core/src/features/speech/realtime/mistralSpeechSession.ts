import { base64ToUint8Array } from "aihappey-ai";
import type { StreamingSpeechSession } from "./streamingSpeechSession";
import { StreamingWaveDecoder } from "./streamingWaveDecoder";

export function buildMistralSpeechSession(model: string, options: any = {}) {
    if (model !== "mistral/voxtral-mini-tts-3-0") throw new Error("Select a supported Mistral realtime speech model.");
    if (options.sampleRate != null || options.sample_rate != null)
        throw new Error("Mistral realtime speech does not support selecting a sample rate.");
    const voice = options.voice ?? options.voice_id ?? options.voiceId;
    const reference = options.ref_audio;
    if (voice != null && (typeof voice !== "string" || !/^voice_\d+$/.test(voice))) throw new Error("Mistral requires a preset voice ID.");
    if (reference != null && (typeof reference !== "string" || !reference.length || reference.length > 8 * 1024 * 1024
        || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(reference)))
        throw new Error("Mistral reference audio must be bounded base64 audio.");
    if (voice != null && reference != null) throw new Error("Select a Mistral voice or reference audio, not both.");
    const mode = options.streaming_mode ?? options.streamingMode ?? "responsive";
    if (!["responsive", "long_form"].includes(mode)) throw new Error("Unsupported Mistral streaming mode.");
    // The WAV header supplies the actual playback format; never guess the raw PCM sample rate.
    return { type: "session.update", session: {
        ...(reference != null ? { ref_audio: reference } : { voice: voice ?? "voice_447" }),
        streaming_mode: mode as string, response_format: "wav",
    } };
}

/** One block owns one socket; generation audio is ordered and normal end waits for server close. */
export async function openMistralSpeechSession(args: {
    model: string; options?: any; token: string; signal: AbortSignal;
    audio: (bytes: Uint8Array, sampleRate: number) => void; failed?: () => void;
}): Promise<StreamingSpeechSession> {
    const update = buildMistralSpeechSession(args.model, args.options);
    args.signal.throwIfAborted();
    if (!/^rt_[!#$%&'*+.^_`|~A-Za-z0-9-]+$/.test(args.token)) throw new Error("Mistral requires a short-lived realtime token.");
    const ws = new WebSocket("wss://api.mistral.ai/v1/audio/speech/realtime?model=voxtral-mini-tts-3-0", ["realtime", args.token]);
    let created = false, configured = false, disposed = false, ending = false, dirty = false;
    let submitted = 0, completed = 0, sampleRate = 0, bytesReceived = 0;
    let decoder: StreamingWaveDecoder | undefined, failure: Error | undefined, finishPromise: Promise<void> | undefined;
    let resolveReady!: () => void, rejectReady!: (error: Error) => void, resolveDone!: () => void, rejectDone!: (error: Error) => void;
    const ready = new Promise<void>((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
    const done = new Promise<void>((resolve, reject) => { resolveDone = resolve; rejectDone = reject; });
    void done.catch(() => {});
    const fail = (message = "Mistral speech connection failed.") => {
        if (failure || disposed) return;
        failure = new Error(message); clearTimeout(startup);
        args.failed?.(); rejectReady(failure); rejectDone(failure); ws.close();
    };
    const startup = setTimeout(() => fail("Mistral speech setup timed out."), 15000);
    const abort = () => fail("Mistral speech was cancelled.");
    args.signal.addEventListener("abort", abort, { once: true });
    const send = (message: object) => {
        args.signal.throwIfAborted();
        if (failure || disposed || ws.readyState !== WebSocket.OPEN) throw failure ?? new Error("Mistral speech connection is closed.");
        if (ws.bufferedAmount > 512 * 1024) { fail("Mistral speech send backlog exceeded."); throw failure; }
        ws.send(JSON.stringify(message));
    };
    ws.onerror = () => fail();
    ws.onclose = event => {
        if (failure || disposed) return;
        if (ending && event.code === 1000 && completed === submitted && !decoder) resolveDone();
        else fail("Mistral disconnected before confirming the final speech.");
    };
    ws.onmessage = event => {
        if (failure || disposed || args.signal.aborted) return;
        try {
            if (typeof event.data !== "string" || event.data.length > 1024 * 1024) throw new Error();
            const message = JSON.parse(event.data);
            if (message.type === "error") { fail("Mistral reported a speech error. Check the selected model and settings."); return; }
            if (message.type === "session.created") {
                if (created) throw new Error();
                created = true; send(update);
            } else if (message.type === "session.updated") {
                const session = message.session;
                if (!created || configured || session?.response_format !== "wav" || session?.streaming_mode !== update.session.streaming_mode
                    || "voice" in update.session && session?.voice !== update.session.voice) throw new Error();
                configured = true; clearTimeout(startup); resolveReady();
            } else if (message.type === "speech.audio.delta") {
                if (!configured || completed >= submitted && !dirty || typeof message.audio_data !== "string" || !message.audio_data.length) throw new Error();
                const bytes = base64ToUint8Array(message.audio_data);
                bytesReceived += bytes.length;
                if (bytesReceived > 100 * 1024 * 1024) throw new Error();
                decoder ??= new StreamingWaveDecoder((pcm, rate) => {
                    if (sampleRate && sampleRate !== rate) throw new Error();
                    sampleRate = rate; args.audio(pcm, rate);
                });
                decoder.push(bytes);
            } else if (message.type === "speech.audio.done") {
                if (!configured || completed >= submitted) throw new Error();
                decoder?.finish(); decoder = undefined; completed++;
            }
        } catch { fail("Mistral returned invalid speech audio or incompatible session settings."); }
    };
    const dispose = () => {
        if (disposed) return;
        fail("Mistral speech was cancelled."); disposed = true; clearTimeout(startup);
        args.signal.removeEventListener("abort", abort); ws.close();
    };
    try { await ready; args.signal.throwIfAborted(); } catch (error) { dispose(); throw error; }
    return {
        append(text) {
            if (ending) throw new Error("Speech input is complete.");
            for (let offset = 0; offset < text.length;) {
                let end = Math.min(offset + 1000, text.length);
                if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1])) end--;
                dirty = true; send({ type: "input_text.append", text: text.slice(offset, end) }); offset = end;
            }
        },
        flush() {
            if (ending) throw new Error("Speech input is complete.");
            if (!dirty) return;
            submitted++; dirty = false; send({ type: "input_text.flush" });
        },
        finish() {
            return finishPromise ??= (async () => {
                ending = true; if (dirty) { submitted++; dirty = false; }
                const timeout = setTimeout(() => fail("Mistral speech completion timed out."), 60000);
                try { send({ type: "input_text.end" }); await done; args.signal.throwIfAborted(); }
                finally { clearTimeout(timeout); }
            })();
        },
        cancel: dispose, dispose,
    };
}
