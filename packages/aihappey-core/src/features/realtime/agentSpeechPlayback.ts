import { base64ToUint8Array, concatUint8Arrays, streamSpeech, SpeechStreamingUnsupportedError, type SpeechAudioFormat } from "aihappey-ai";
import type { AiSpeech } from "aihappey-types";
import { agentSpeechFormatName, agentSpeechProviderOptions, agentSpeechSettings } from "../agents/agentSpeechSettings";
import type { ChatConfig } from "../chat/context/ChatContext";
import { buildOperationHeaders, createCredentialScopedFetch } from "../provider-credentials/scopedRequest";
import { PcmSpeechOutput } from "../speech/realtime/pcmSpeechOutput";
import { isOpenAiSpeechModelId } from "../speech/realtime/openAiSpeechConfig";

const abortError = () => new DOMException("Speech cancelled", "AbortError");

// Google uses audio/mp3; browsers advertise the same MPEG bitstream as audio/mpeg.
const playbackFormat = (format: SpeechAudioFormat): SpeechAudioFormat => {
    const [mime, ...parameters] = format.type.trim().split(";");
    const type = mime.trim().toLowerCase();
    return { ...format, type: [type === "audio/mp3" ? "audio/mpeg" : type, ...parameters].join(";") };
};

const pcmFormat = (format: SpeechAudioFormat, model: string, metadata?: Record<string, unknown>) => {
    const [mime, ...parameters] = format.type.toLowerCase().split(";");
    const type = mime.trim();
    if (!["audio/pcm", "audio/pcm_s16le", "audio/l16"].includes(type)) return undefined;
    const parameter = (name: string) => parameters.map(value => value.trim().split("=")).find(([key]) => key === name)?.[1]?.replace(/^"|"$/g, "");
    const rate = format.rate ?? Number(parameter("rate"));
    if (!Number.isInteger(rate) || rate <= 0) throw new Error("Raw PCM speech requires a reported positive sample rate.");
    const google = model.split("/")[0] === "google";
    const native = google ? metadata?.google as { channels?: unknown } | undefined : undefined;
    const channels = parameter("channels") === undefined ? native?.channels ?? 1 : Number(parameter("channels"));
    if (channels !== 1) throw new Error("Speech PCM playback currently requires mono audio.");
    // Google's Gemini L16 bytes are signed PCM16 little-endian. Standard L16 from
    // other providers is big-endian; do not globally alias L16 to pcm_s16le.
    return { rate, littleEndian: type !== "audio/l16" || google };
};

/** Uses the format reported by the new API; PCM rates are never assumed to be 24 kHz. */
export class AgentAudioOutput {
    private context?: AudioContext;
    constructor(context?: AudioContext) { this.context = context; }
    unlock() {
        const Ctor = window.AudioContext || (window as any).webkitAudioContext;
        this.context ??= Ctor ? new Ctor() : undefined;
        void this.context?.resume();
    }
    dispose() { void this.context?.close().catch(() => {}); this.context = undefined; }
    get audioContext() { this.unlock(); if (!this.context) throw new Error("Audio playback is unavailable in this browser."); return this.context; }
    async speak(config: ChatConfig, customHeaders: Record<string, string> | undefined, speech: AiSpeech, text: string, signal: AbortSignal) {
        signal.throwIfAborted();
        const model = speech.model;
        if (!model?.id) throw new Error("Speech requires a model.");
        const settings = agentSpeechSettings(speech);
        // A stale/missing capability must not send a Realtime-only model to HTTP speech.
        if (isOpenAiSpeechModelId(model.id)) throw new Error("OpenAI Realtime speech is unavailable; refresh the model catalog.");
        const provider = model.id.split("/")[0];
        const providerOptions = model.providerMetadata?.[provider] === undefined ? undefined
            : { [provider]: agentSpeechProviderOptions(speech) };
        const headers = await buildOperationHeaders(config, { ...customHeaders, ...model.providerHeaders }, model.id);
        signal.throwIfAborted();
        const fetcher = createCredentialScopedFetch(config.fetch);
        const speechUrl = config.baseUrl.replace(/\/$/, "") + config.endpoints.speech;
        try {
            await this.streaming({ url: speechUrl + "/stream", model: model.id, text, headers, providerOptions, ...settings, fetch: fetcher, signal });
            return;
        } catch (error) {
            if (signal.aborted || !(error instanceof SpeechStreamingUnsupportedError)) throw error;
        }
        // An unsupported streaming endpoint/provider is not a user-facing error.
        const response = await fetcher(speechUrl, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, signal,
            body: JSON.stringify({ model: model.id, text, providerOptions, ...settings, outputFormat: agentSpeechFormatName(settings.outputFormat?.type) }) });
        if (!response.ok) throw new Error(await response.text() || `Speech failed (${response.status})`);
        const result = await response.json();
        if (!result.audio?.base64 || !result.audio?.mimeType) throw new Error("Speech returned no playable audio.");
        await this.playBytes(base64ToUint8Array(result.audio.base64), { type: result.audio.mimeType }, signal, model.id);
    }
    private async playBytes(bytes: Uint8Array, format: SpeechAudioFormat, signal: AbortSignal, model = "") {
        signal.throwIfAborted();
        this.unlock();
        const context = this.context;
        if (!context) throw new Error("Audio playback is unavailable in this browser.");
        let buffer: AudioBuffer;
        const pcm = pcmFormat(format, model);
        if (pcm) {
            if (!bytes.length || bytes.length % 2) throw new Error("Speech returned invalid PCM audio.");
            buffer = context.createBuffer(1, bytes.length / 2, pcm.rate);
            const channel = buffer.getChannelData(0);
            const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
            for (let i = 0; i < channel.length; i++) channel[i] = view.getInt16(i * 2, pcm.littleEndian) / 32768;
        } else {
            buffer = await context.decodeAudioData(bytes.slice().buffer as ArrayBuffer);
        }
        signal.throwIfAborted();
        await context.resume();
        signal.throwIfAborted();
        await new Promise<void>((resolve, reject) => {
            const source = context.createBufferSource(); source.buffer = buffer; source.connect(context.destination);
            const abort = () => { source.onended = null; source.stop(); source.disconnect(); reject(abortError()); };
            source.onended = () => { signal.removeEventListener("abort", abort); source.disconnect(); resolve(); };
            signal.addEventListener("abort", abort, { once: true }); source.start();
        });
    }
    private async streaming(args: Omit<Parameters<typeof streamSpeech>[0], "onAudio">) {
        const chunks: Uint8Array[] = [];
        let format: SpeechAudioFormat | undefined;
        let reportedFormat: SpeechAudioFormat | undefined;
        let receivedAudio = false, chunkCount = 0, byteCount = 0, stage = "request";
        let pcm: PcmSpeechOutput | undefined;
        let pcmSettings: ReturnType<typeof pcmFormat>;
        // MediaSource handles ordered encoded chunks which need not be standalone files.
        const audio = new Audio();
        let source: MediaSource | undefined, buffer: SourceBuffer | undefined, url: string | undefined;
        let queue: Uint8Array[] = [], failed: unknown, opened: Promise<void> | undefined;
        let failureStage: string | undefined;
        const fail = (error: unknown, at: string) => { if (!failed) { failed = error; failureStage = at; } };
        const stop = () => { audio.pause(); audio.removeAttribute("src"); audio.load(); if (url) URL.revokeObjectURL(url); };
        const flush = () => {
            if (!buffer || buffer.updating || !queue.length || args.signal.aborted) return;
            try { buffer.appendBuffer(queue.shift()!.slice().buffer as ArrayBuffer); } catch (error) { fail(error, "media-source-append"); }
        };
        args.signal.addEventListener("abort", stop, { once: true });
        try {
            await streamSpeech({ ...args, onAudio: async part => {
                receivedAudio = true;
                stage = "audio-format";
                if (!part.audioFormat?.type) throw new Error("Speech stream returned audio without audioFormat.type.");
                reportedFormat = { type: part.audioFormat.type, rate: part.audioFormat.rate };
                const nextFormat = playbackFormat(part.audioFormat);
                const nextPcm = pcmFormat(nextFormat, args.model, part.providerMetadata);
                // MPEG frames carry their own rate; an inferred rate may be corrected by later Google metadata.
                if (format && (format.type !== nextFormat.type ||
                    (format.type !== "audio/mpeg" && format.rate !== nextFormat.rate) ||
                    pcmSettings?.rate !== nextPcm?.rate || pcmSettings?.littleEndian !== nextPcm?.littleEndian)) {
                    throw new Error("Speech format changed during streaming.");
                }
                if (!format) {
                    format = nextFormat;
                    pcmSettings = nextPcm;
                    if (nextPcm) {
                        stage = "pcm-resume";
                        const context = this.audioContext;
                        await context.resume();
                        args.signal.throwIfAborted();
                        pcm = new PcmSpeechOutput(nextPcm.rate, args.signal, () => {}, context,
                            { littleEndian: nextPcm.littleEndian, initialBufferSeconds: 0.08 });
                    } else if (typeof MediaSource !== "undefined" && MediaSource.isTypeSupported(format.type)) {
                        source = new MediaSource(); url = URL.createObjectURL(source); audio.src = url;
                        opened = new Promise<void>((resolve, reject) => {
                            source!.addEventListener("sourceopen", () => {
                                try { buffer = source!.addSourceBuffer(format!.type); buffer.mode = "sequence";
                                    buffer.addEventListener("updateend", flush); buffer.addEventListener("error", () => { fail(new Error("Streaming audio decoding failed."), "media-source-decode"); });
                                    flush(); void audio.play().catch(error => { fail(error, "media-element-play"); }); resolve();
                                } catch (error) { fail(error, "media-source-open"); reject(error); }
                            }, { once: true });
                        });
                        void opened.catch(() => undefined);
                    }
                }
                stage = "audio-data";
                const bytes = base64ToUint8Array(part.audio); chunkCount++; byteCount += bytes.length;
                if (pcm) { stage = "pcm-schedule"; pcm.push(bytes); }
                else { chunks.push(bytes); if (source) { queue.push(bytes); flush(); } }
                stage = "stream";
            } });
            if (!chunkCount || !byteCount || !format) throw new Error("Speech stream returned no audio.");
            if (pcm) { stage = "pcm-drain"; await pcm.drain(); return; }
            if (!source) { stage = "buffered-decode/playback"; await this.playBytes(concatUint8Arrays(chunks), format, args.signal); return; }
            stage = "media-source/playback";
            // Polling is bounded and abort-aware, including asynchronous SourceBuffer/media errors.
            const started = Date.now();
            while (!audio.ended) {
                args.signal.throwIfAborted();
                if (failed || audio.error) throw failed ?? new Error(audio.error?.message || "Audio playback failed.");
                if (buffer && !buffer.updating && !queue.length && source.readyState === "open") source.endOfStream();
                if (Date.now() - started > 300_000) throw new Error("Speech playback timed out.");
                await new Promise(resolve => setTimeout(resolve, 20));
            }
        } catch (error) {
            if (args.signal.aborted) throw error;
            if (!receivedAudio && error instanceof SpeechStreamingUnsupportedError) throw error;
            stage = failureStage ?? stage;
            const diagnostic = { stage, receivedAudio, format, reportedFormat, chunks: chunkCount, bytes: byteCount,
                mediaSource: !!source, mediaErrorCode: audio.error?.code, errorName: error instanceof Error ? error.name : "UnknownError" };
            // Deliberately exclude text, headers, audio bytes, provider metadata and server error bodies.
            console.warn("[AgentSpeechPlayback] Streaming/playback failed; no synthesis retry.", diagnostic);
            const detail = error instanceof Error ? error.message : "Unknown speech error";
            throw Object.assign(new Error(`Speech ${stage} failed (${format?.type ?? "unknown format"}, ${chunkCount} chunks, ${byteCount} bytes): ${detail}`), { cause: error });
        } finally { pcm?.stop(); args.signal.removeEventListener("abort", stop); stop(); queue = []; }
    }
}
