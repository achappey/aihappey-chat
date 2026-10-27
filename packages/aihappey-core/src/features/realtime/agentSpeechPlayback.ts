import { base64ToUint8Array, concatUint8Arrays, streamSpeech, type SpeechAudioFormat } from "aihappey-ai";
import type { AiModel } from "aihappey-types";
import type { ChatConfig } from "../chat/context/ChatContext";
import { buildOperationHeaders, createCredentialScopedFetch } from "../provider-credentials/scopedRequest";

const abortError = () => new DOMException("Speech cancelled", "AbortError");

/** Uses the format reported by the new API; PCM rates are never assumed to be 24 kHz. */
export class AgentAudioOutput {
    private context?: AudioContext;
    unlock() {
        const Ctor = window.AudioContext || (window as any).webkitAudioContext;
        this.context ??= Ctor ? new Ctor() : undefined;
        void this.context?.resume();
    }
    dispose() { void this.context?.close(); this.context = undefined; }
    async speak(config: ChatConfig, customHeaders: Record<string, string> | undefined, model: AiModel, text: string, signal: AbortSignal) {
        signal.throwIfAborted();
        const provider = model.id.split("/")[0];
        const providerOptions = model.providerMetadata?.[provider] === undefined ? undefined
            : { [provider]: model.providerMetadata[provider] };
        const headers = await buildOperationHeaders(config, { ...customHeaders, ...model.providerHeaders }, model.id);
        signal.throwIfAborted();
        const fetcher = createCredentialScopedFetch(config.fetch);
        const speechUrl = config.baseUrl.replace(/\/$/, "") + config.endpoints.speech;
        try {
            await this.streaming({ url: speechUrl + "/stream", model: model.id, text, headers, providerOptions, fetch: fetcher, signal });
            return;
        } catch (error) { if (signal.aborted) throw error; }
        // An unsupported streaming endpoint/provider is not a user-facing error.
        const response = await fetcher(speechUrl, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, signal,
            body: JSON.stringify({ model: model.id, text, providerOptions }) });
        if (!response.ok) throw new Error(await response.text() || `Speech failed (${response.status})`);
        const result = await response.json();
        if (!result.audio?.base64 || !result.audio?.mimeType) throw new Error("Speech returned no playable audio.");
        await this.playBytes(base64ToUint8Array(result.audio.base64), { type: result.audio.mimeType }, signal);
    }
    private async playBytes(bytes: Uint8Array, format: SpeechAudioFormat, signal: AbortSignal) {
        signal.throwIfAborted();
        this.unlock();
        const context = this.context;
        if (!context) throw new Error("Audio playback is unavailable in this browser.");
        let buffer: AudioBuffer;
        if (format.type === "audio/pcm" || format.type === "audio/pcm_s16le") {
            if (!format.rate || bytes.length % 2) throw new Error("Speech returned invalid PCM audio.");
            buffer = context.createBuffer(1, bytes.length / 2, format.rate);
            const channel = buffer.getChannelData(0);
            const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
            for (let i = 0; i < channel.length; i++) channel[i] = view.getInt16(i * 2, true) / 32768;
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
        // MediaSource handles ordered encoded chunks which need not be standalone files.
        const audio = new Audio();
        let source: MediaSource | undefined, buffer: SourceBuffer | undefined, url: string | undefined;
        let queue: Uint8Array[] = [], failed: unknown, opened: Promise<void> | undefined;
        const stop = () => { audio.pause(); audio.removeAttribute("src"); audio.load(); if (url) URL.revokeObjectURL(url); };
        const flush = () => {
            if (!buffer || buffer.updating || !queue.length || args.signal.aborted) return;
            try { buffer.appendBuffer(queue.shift()!.slice().buffer as ArrayBuffer); } catch (error) { failed = error; }
        };
        args.signal.addEventListener("abort", stop, { once: true });
        try {
            await streamSpeech({ ...args, onAudio: part => {
                if (format && (format.type !== part.audioFormat.type || format.rate !== part.audioFormat.rate)) throw new Error("Speech format changed during streaming.");
                if (!format) {
                    format = part.audioFormat;
                    if (typeof MediaSource !== "undefined" && MediaSource.isTypeSupported(format.type)) {
                        source = new MediaSource(); url = URL.createObjectURL(source); audio.src = url;
                        opened = new Promise<void>((resolve, reject) => {
                            source!.addEventListener("sourceopen", () => {
                                try { buffer = source!.addSourceBuffer(format!.type); buffer.mode = "sequence";
                                    buffer.addEventListener("updateend", flush); buffer.addEventListener("error", () => { failed = new Error("Streaming audio decoding failed."); });
                                    flush(); void audio.play().catch(error => { failed = error; }); resolve();
                                } catch (error) { failed = error; reject(error); }
                            }, { once: true });
                        });
                        void opened.catch(() => undefined);
                    }
                }
                const bytes = base64ToUint8Array(part.audio); chunks.push(bytes);
                if (source) { queue.push(bytes); flush(); }
            } });
            if (!chunks.length || !format) throw new Error("Speech stream returned no audio.");
            if (!source) { await this.playBytes(concatUint8Arrays(chunks), format, args.signal); return; }
            // Polling is bounded and abort-aware, including asynchronous SourceBuffer/media errors.
            const started = Date.now();
            while (!audio.ended) {
                args.signal.throwIfAborted();
                if (failed || audio.error) throw failed ?? new Error(audio.error?.message || "Audio playback failed.");
                if (buffer && !buffer.updating && !queue.length && source.readyState === "open") source.endOfStream();
                if (Date.now() - started > 300_000) throw new Error("Speech playback timed out.");
                await new Promise(resolve => setTimeout(resolve, 20));
            }
        } finally { args.signal.removeEventListener("abort", stop); stop(); queue = []; }
    }
}
