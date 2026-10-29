import type { AiModel } from "aihappey-types";
import type { ChatConfig } from "../chat/context/ChatContext";
import { buildOperationHeaders, createCredentialScopedFetch } from "../provider-credentials/scopedRequest";
import { speechProtocolFactories } from "../speech/realtime/speechProtocol";
import { PcmSpeechOutput } from "../speech/realtime/pcmSpeechOutput";
import { openStreamingSpeechSession, type StreamingSpeechSession } from "../speech/realtime/streamingSpeechSession";
import { buildOpenAiSpeechSession, isOpenAiSpeechModelId, openAiSpeechRate } from "../speech/realtime/openAiSpeechConfig";
import { openOpenAiSpeechSession } from "../speech/realtime/openAiSpeechSession";

export async function openAgentSpeech(args: {
    config: ChatConfig; model: AiModel; customHeaders?: Record<string, string>; signal: AbortSignal;
    context: AudioContext; started: () => void;
}): Promise<StreamingSpeechSession> {
    const provider = args.model.id.split("/")[0];
    const options = args.model.providerMetadata?.[provider] ?? {};
    const openai = isOpenAiSpeechModelId(args.model.id);
    const providerOptions = openai ? { openai: { session: buildOpenAiSpeechSession(args.model.id, options) } } : { [provider]: {} };
    // A timeout covers backend credential acquisition too, not just the WebSocket handshake.
    const signal = AbortSignal.any([args.signal, AbortSignal.timeout(15_000)]);
    const headers = await buildOperationHeaders(args.config, { ...args.customHeaders, ...args.model.providerHeaders }, args.model.id);
    for (const key of Object.keys(headers)) if (key.toLowerCase() === "x-aihappey-debug") delete headers[key];
    const response = await createCredentialScopedFetch(args.config.fetch)(args.config.baseUrl.replace(/\/$/, "") + args.config.endpoints.realtime, {
        method: "POST", signal, headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ model: args.model.id, providerOptions }),
    });
    if (!response.ok) throw new Error("Speech credential request failed.");
    const token = await response.json(); signal.throwIfAborted();
    if (typeof token.value !== "string" || !token.value.trim() || !Number.isFinite(token.expires_at)
        || token.expires_at <= Date.now() / 1000) throw new Error("Speech credential is missing or expired.");
    const protocol = openai ? undefined : speechProtocolFactories[provider](args.model.id.slice(provider.length + 1), options,
        token.providerMetadata?.cartesia?.cartesia_version);
    await args.context.resume(); args.signal.throwIfAborted();
    const output = new PcmSpeechOutput(protocol?.sampleRate ?? openAiSpeechRate, args.signal, args.started, args.context);
    let session: StreamingSpeechSession;
    const playback = { token: token.value, signal: args.signal, audio: (bytes: Uint8Array) => output.push(bytes), failed: output.stop };
    try { session = openai ? await openOpenAiSpeechSession({ ...playback, model: args.model.id, options })
        : await openStreamingSpeechSession({ ...playback, protocol: protocol! }); }
    catch (error) { output.stop(); throw error; }
    return { append: text => session.append(text), flush: () => session.flush(),
        async finish() { await session.finish(); await output.drain(); },
        cancel() { session.cancel(); output.stop(); }, dispose() { session.dispose(); output.stop(); } };
}
