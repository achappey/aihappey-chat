/** Protocol-only adapters. No credentials, sockets, UI, or playback state live here. */
export type SpeechProtocol = {
    provider: string; sampleRate: number; url: string;
    append: (text: string) => object;
    finish: () => object;
    cancel: () => object;
    flush?: () => object;
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
