/** Protocol-only adapters. No credentials, sockets, UI, or playback state live here. */
export type SpeechProtocol = {
    provider: string; sampleRate: number; url: string;
    append: (text: string) => object;
    finish: () => object;
    cancel: () => object;
    flush?: () => object;
    /** Continuations have segment acknowledgements, but no terminal context acknowledgement. */
    quietPeriodMs?: number;
    audio: (message: any) => string | undefined;
    done: (message: any) => boolean;
};

const rate = (value: unknown, allowed: number[], fallback: number) => {
    const result = value === undefined ? fallback : Number(value);
    if (!allowed.includes(result)) throw new Error("Unsupported streaming speech sample rate.");
    return result;
};
const bounded = (value: unknown, min: number, max: number) => {
    if (value === undefined) return undefined;
    if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max)
        throw new Error("Invalid streaming speech setting.");
    return value;
};

export const speechProtocolFactories: Record<string, (id: string, options: any, version?: string) => SpeechProtocol> = {
    smallestai: (id, options = {}) => {
        const match = /^(lightning_v3\.1(?:_pro)?)(?:\/([^/]+))?$/.exec(id.replace(/^lightning-v3\.1(-pro)?/, (_, pro) => `lightning_v3.1${pro ? "_pro" : ""}`));
        const voice = match?.[2] ?? options.voice ?? options.voiceId ?? options.voice_id;
        if (!match || typeof voice !== "string" || !voice.trim()) throw new Error("Smallest AI streaming speech requires a supported model and voice.");
        const sampleRate = rate(options.sampleRate ?? options.sample_rate, [8000, 16000, 24000, 44100], 24000);
        const context = crypto.randomUUID();
        const payload: Record<string, unknown> = { model: match[1], voice_id: voice.trim(), sample_rate: sampleRate,
            output_format: "pcm", speed: bounded(options.speed, 0.5, 2) ?? 1,
            context_id: context, max_buffer_delay_ms: 200, complete_backoff_ms: 0 };
        const languages = ["auto", "en", "hi", "mr", "kn", "ta", "bn", "gu", "te", "ml", "pa", "or", "es", "de", "fr", "it", "nl", "sv", "pt", "ru", "el", "fi", "no", "pl", "ar", "zh", "id", "ja", "ko", "ms", "tr", "vi"];
        for (const [source, target] of [["language", "language"], ["numberPronunciationLanguage", "number_pronunciation_language"], ["dateFormat", "date_format"]]) {
            const value = options[source] ?? options[target];
            if (value === undefined || value === "") continue;
            if (!(target === "date_format" ? ["EU", "US"] : languages).includes(value)) throw new Error("Unsupported Smallest AI speech language or date format.");
            payload[target] = value;
        }
        for (const [source, target] of [["wordTimestamps", "word_timestamps"], ["mathNotation", "math_notation"]]) {
            const value = options[source] ?? options[target];
            if (value !== undefined) { if (typeof value !== "boolean") throw new Error("Invalid Smallest AI speech flag."); payload[target] = value; }
        }
        return { provider: "smallestai", sampleRate, url: "wss://api.smallest.ai/waves/v1/tts/live", quietPeriodMs: 5000,
            append: text => ({ ...payload, text, continue: true }),
            finish: () => ({ context_id: context, voice_id: voice.trim(), continue: false }),
            // Closing the block-owned socket discards every context without flushing it.
            cancel: () => ({ context_id: context, cancel_request: true }),
            audio: message => message.status === "chunk" ? message.data?.audio : undefined,
            done: message => message.status === "complete" };
    },
    deepgram: (id, options = {}) => {
        if (!/^aura-(?:2-)?[a-z]+-[a-z]{2}$/.test(id)) throw new Error("Unsupported Deepgram speech model.");
        const sampleRate = rate(options.sampleRate ?? options.sample_rate, [8000, 16000, 24000, 32000, 48000], 24000);
        const url = new URL("wss://api.deepgram.com/v1/speak");
        url.searchParams.set("model", id); url.searchParams.set("encoding", "linear16"); url.searchParams.set("sample_rate", String(sampleRate));
        const speed = bounded(options.speed, 0.7, 1.5);
        if (speed !== undefined) url.searchParams.set("speed", String(speed));
        const optOut = options.mipOptOut ?? options.mip_opt_out;
        if (typeof optOut === "boolean") url.searchParams.set("mip_opt_out", String(optOut));
        return { provider: "deepgram", sampleRate, url: url.toString(),
            append: text => ({ type: "Speak", text }), flush: () => ({ type: "Flush" }),
            finish: () => ({ type: "Flush" }), cancel: () => ({ type: "Clear" }),
            audio: () => undefined, done: message => message.type === "Flushed" };
    },
    cartesia: (id, options = {}, version = "2026-08-14") => {
        const match = /^tts\/(sonic-3\.6|sonic-3\.5|sonic-3|sonic-latest)\/([^/]+)$/.exec(id);
        if (!match) throw new Error("Unsupported Cartesia speech model.");
        // The socket protocol is pinned to the negotiated version, not an arbitrary saved HTTP version.
        if (options.apiVersion && options.apiVersion !== version) throw new Error("Unsupported Cartesia streaming API version.");
        const sampleRate = rate(options.sampleRate ?? options.sample_rate, [8000, 16000, 22050, 24000, 44100, 48000], 24000);
        const context = crypto.randomUUID();
        const url = new URL("wss://api.cartesia.ai/tts/websocket"); url.searchParams.set("cartesia_version", version);
        const generation_config = { speed: bounded(options.speed, 0.6, 1.5), volume: bounded(options.volume, 0.5, 2), emotion: options.emotion };
        if (options.emotion !== undefined && !["neutral", "calm", "angry", "content", "sad"].includes(options.emotion))
            throw new Error("Unsupported Cartesia streaming emotion.");
        const payload = { model_id: match[1], voice: { id: match[2] }, context_id: context,
            output_format: { container: "raw", encoding: "pcm_s16le", sample_rate: sampleRate },
            ...(options.language ? { language: options.language } : {}), generation_config, max_buffer_delay_ms: 200 };
        return { provider: "cartesia", sampleRate, url: url.toString(),
            append: text => ({ ...payload, transcript: text, continue: true }),
            finish: () => ({ ...payload, transcript: "", continue: false }), cancel: () => ({ context_id: context, cancel: true }),
            audio: message => message.context_id === context && message.type === "chunk" ? message.data : undefined,
            done: message => message.context_id === context && (message.type === "done" || message.type === "chunk" && message.done === true) };
    },
};

export const supportsRealtimeSpeech = (model: { id: string; type?: string; tags?: string[] } | undefined) =>
    model?.type === "speech" && model.tags?.includes("real-time") === true
    && model.tags.includes("realtime-token") && !!speechProtocolFactories[model.id.split("/")[0]];
