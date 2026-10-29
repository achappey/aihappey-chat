import { readOpenAISse } from "./openAIAudioStreaming";

export type SpeechAudioFormat = { type: string; rate?: number };
export type SpeechStreamPart =
    | { type: "stream-start"; warnings: unknown[] }
    | { type: "audio"; id?: string; audio: string; audioFormat: SpeechAudioFormat; providerMetadata?: Record<string, unknown> }
    | { type: "response-metadata"; modelId?: string; timestamp?: string }
    | { type: "finish"; usage?: unknown; providerMetadata?: Record<string, unknown> }
    | { type: "raw"; rawValue: unknown }
    | { type: "error"; error: unknown };

/** Only this error permits a new non-streaming synthesis request. */
export class SpeechStreamingUnsupportedError extends Error {
    constructor(message = "Speech streaming is not supported.") {
        super(message);
        this.name = "SpeechStreamingUnsupportedError";
    }
}

/** POST /api/speech/stream, not the OpenAI /v1/audio/speech protocol. */
export async function streamSpeech(args: {
    url: string; model: string; text: string; providerOptions?: Record<string, unknown>;
    voice?: string; instructions?: string; speed?: number; language?: string; outputFormat?: SpeechAudioFormat;
    headers?: HeadersInit; fetch?: typeof fetch; signal: AbortSignal;
    onAudio: (part: Extract<SpeechStreamPart, { type: "audio" }>) => void | Promise<void>;
}) {
    let finished = false;
    let receivedAudio = false;
    const fetcher = args.fetch ?? globalThis.fetch;
    try {
        await readOpenAISse<SpeechStreamPart>({ url: args.url, fetch: async (url, init) => {
                const response = await fetcher(url, init);
                if ([404, 405, 501].includes(response.status)) {
                    await response.body?.cancel().catch(() => undefined);
                    throw new SpeechStreamingUnsupportedError(`Speech streaming endpoint is unavailable (${response.status}).`);
                }
                return response;
            }, signal: args.signal,
            init: { method: "POST", headers: { ...Object.fromEntries(new Headers(args.headers).entries()), "Content-Type": "application/json" },
                body: JSON.stringify({ model: args.model, text: [{ type: "text", text: args.text }],
                    voice: args.voice, instructions: args.instructions, speed: args.speed, language: args.language, outputFormat: args.outputFormat,
                    providerOptions: args.providerOptions }) },
            onEvent: async part => {
                args.signal.throwIfAborted();
                if (part.type === "audio" && part.audio) {
                    receivedAudio = true; // Set before the callback: playback errors must never cause re-synthesis.
                    await args.onAudio(part);
                }
                if (part.type === "finish") finished = true;
            },
        });
        args.signal.throwIfAborted();
        if (!finished) throw new Error("Speech stream ended without a finish event.");
    } catch (error) {
        if (args.signal.aborted || receivedAudio) throw error;
        // Older gateways report unsupported providers as an SSE error string.
        // Do not mistake unsupported models, voices, or output formats for an absent streaming capability.
        if (error instanceof Error && /^(?:Provider '[^']+' does not support (?:Vercel )?speech streaming(?: yet)?\.?|(?:Speech streaming|Streaming speech) is not (?:supported|implemented)\.?)$/i.test(error.message)) {
            throw new SpeechStreamingUnsupportedError(error.message);
        }
        throw error;
    }
}
