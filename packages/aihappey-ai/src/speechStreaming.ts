import { readOpenAISse } from "./openAIAudioStreaming";

export type SpeechAudioFormat = { type: string; rate?: number };
export type SpeechStreamPart =
    | { type: "stream-start"; warnings: unknown[] }
    | { type: "audio"; id?: string; audio: string; audioFormat: SpeechAudioFormat; providerMetadata?: Record<string, unknown> }
    | { type: "response-metadata"; modelId?: string; timestamp?: string }
    | { type: "finish"; usage?: unknown; providerMetadata?: Record<string, unknown> }
    | { type: "raw"; rawValue: unknown }
    | { type: "error"; error: unknown };

/** POST /api/speech/stream, not the OpenAI /v1/audio/speech protocol. */
export async function streamSpeech(args: {
    url: string; model: string; text: string; providerOptions?: Record<string, unknown>;
    headers?: HeadersInit; fetch?: typeof fetch; signal: AbortSignal;
    onAudio: (part: Extract<SpeechStreamPart, { type: "audio" }>) => void;
}) {
    let finished = false;
    await readOpenAISse<SpeechStreamPart>({ url: args.url, fetch: args.fetch, signal: args.signal,
        init: { method: "POST", headers: { ...Object.fromEntries(new Headers(args.headers).entries()), "Content-Type": "application/json" },
            body: JSON.stringify({ model: args.model, text: [{ type: "text", text: args.text }],
                outputFormat: { type: "audio/mpeg" }, providerOptions: args.providerOptions }) },
        onEvent: part => {
            args.signal.throwIfAborted();
            if (part.type === "audio" && part.audio) args.onAudio(part);
            if (part.type === "finish") finished = true;
        },
    });
    args.signal.throwIfAborted();
    if (!finished) throw new Error("Speech stream ended without a finish event.");
}
