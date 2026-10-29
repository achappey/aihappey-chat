import type { SpeechResponse } from "aihappey-ai";
import type { ChatConfig } from "../../chat/context/ChatContext";
import { createCredentialScopedFetch } from "../../provider-credentials/scopedRequest";
import { speechProtocolFactories } from "./speechProtocol";
import { openStreamingSpeechSession, type StreamingSpeechSession } from "./streamingSpeechSession";
import { PcmSpeechOutput } from "./pcmSpeechOutput";

export const canStreamSmallestSpeech = (options: any) =>
    [undefined, "", "wav", "wave", "pcm"].includes(options.outputFormat ?? options.output_format)
    && !options.pronunciationDicts?.length && !options.pronunciation_dicts?.length;

export function pcmWave(pcm: Uint8Array, sampleRate: number): Uint8Array {
    if (!pcm.length || pcm.length % 2) throw new Error("Speech returned invalid PCM audio.");
    const bytes = new Uint8Array(44 + pcm.length), view = new DataView(bytes.buffer);
    const label = (at: number, text: string) => { for (let i = 0; i < text.length; i++) bytes[at + i] = text.charCodeAt(i); };
    label(0, "RIFF"); view.setUint32(4, 36 + pcm.length, true); label(8, "WAVEfmt ");
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true); label(36, "data"); view.setUint32(40, pcm.length, true);
    bytes.set(pcm, 44); return bytes;
}

/** Keeps the existing SpeechResponse/library contract; credentials never enter the result. */
export async function generateSmallestSpeech(args: {
    config: ChatConfig; model: string; text: string; options: any; headers: Record<string, string>; signal: AbortSignal;
}): Promise<SpeechResponse> {
    const protocol = speechProtocolFactories.smallestai(args.model.slice("smallestai/".length), args.options);
    const context = new AudioContext();
    let session: StreamingSpeechSession | undefined;
    const output = new PcmSpeechOutput(protocol.sampleRate, args.signal, () => {}, context);
    const chunks: Uint8Array[] = []; let length = 0;
    try {
        await context.resume(); args.signal.throwIfAborted();
        const headers = { ...args.headers };
        for (const key of Object.keys(headers)) if (key.toLowerCase() === "x-aihappey-debug") delete headers[key];
        const response = await createCredentialScopedFetch(args.config.fetch)(args.config.baseUrl.replace(/\/$/, "") + args.config.endpoints.realtime, {
            method: "POST", signal: AbortSignal.any([args.signal, AbortSignal.timeout(15000)]),
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ model: args.model, providerOptions: { smallestai: {} } }),
        });
        if (!response.ok) throw new Error("Speech credential request failed.");
        const token = await response.json();
        if (typeof token.value !== "string" || !Number.isFinite(token.expires_at) || token.expires_at <= Date.now() / 1000) throw new Error("Speech credential is missing or expired.");
        session = await openStreamingSpeechSession({ protocol, token: token.value, signal: args.signal, failed: output.stop,
            audio: bytes => { length += bytes.length; if (length > 100 * 1024 * 1024) throw new Error("Speech audio exceeded its limit."); chunks.push(bytes); output.push(bytes); } });
        session.append(args.text); await session.finish(); await output.drain(); args.signal.throwIfAborted();
        const pcm = new Uint8Array(length); let offset = 0;
        for (const chunk of chunks) { pcm.set(chunk, offset); offset += chunk.length; }
        const format = args.options.outputFormat === "pcm" ? "pcm" : "wav";
        const bytes = format === "wav" ? pcmWave(pcm, protocol.sampleRate) : pcm;
        let binary = "";
        for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
        return { audio: { base64: btoa(binary), mimeType: format === "wav" ? "audio/wav" : `audio/pcm;rate=${protocol.sampleRate}`, format },
            warnings: args.options.instructions ? [{ type: "unsupported", feature: "instructions" }] : [],
            providerMetadata: { smallestai: { streamed: true, sampleRate: protocol.sampleRate } },
            response: { timestamp: new Date(), modelId: args.model } };
    } finally { session?.dispose(); output.stop(); if (context.state !== "closed") await context.close(); }
}
