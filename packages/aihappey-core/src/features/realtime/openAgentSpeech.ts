import type { AiSpeech } from "aihappey-types";
import { agentSpeechSocketOptions } from "../agents/agentSpeechSettings";
import type { ChatConfig } from "../chat/context/ChatContext";
import { buildOperationHeaders, createCredentialScopedFetch } from "../provider-credentials/scopedRequest";
import { speechProtocolFactories } from "../speech/realtime/speechProtocol";
import { PcmSpeechOutput } from "../speech/realtime/pcmSpeechOutput";
import { openStreamingSpeechSession, type StreamingSpeechSession } from "../speech/realtime/streamingSpeechSession";
import { buildOpenAiSpeechSession, isOpenAiSpeechModelId, openAiSpeechRate } from "../speech/realtime/openAiSpeechConfig";
import { openOpenAiSpeechSession } from "../speech/realtime/openAiSpeechSession";
import { buildMistralSpeechSession, openMistralSpeechSession } from "../speech/realtime/mistralSpeechSession";

export async function openAgentSpeech(args: {
    config: ChatConfig; speech: AiSpeech; customHeaders?: Record<string, string>; signal: AbortSignal;
    context: AudioContext; started: () => void;
}): Promise<StreamingSpeechSession> {
    const model = args.speech.model;
    if (!model?.id) throw new Error("Speech requires a model.");
    const provider = model.id.split("/")[0];
    const options = agentSpeechSocketOptions(args.speech);
    const openai = isOpenAiSpeechModelId(model.id);
    const mistral = provider === "mistral";
    if (mistral) buildMistralSpeechSession(model.id, options); // Validate before credential acquisition.
    const providerOptions = openai ? { openai: { session: buildOpenAiSpeechSession(model.id, options, args.speech.instructions) } } : { [provider]: {} };
    // A timeout covers backend credential acquisition too, not just the WebSocket handshake.
    const signal = AbortSignal.any([args.signal, AbortSignal.timeout(15_000)]);
    const headers = await buildOperationHeaders(args.config, { ...args.customHeaders, ...model.providerHeaders }, model.id);
    for (const key of Object.keys(headers)) if (key.toLowerCase() === "x-aihappey-debug") delete headers[key];
    const response = await createCredentialScopedFetch(args.config.fetch)(args.config.baseUrl.replace(/\/$/, "") + args.config.endpoints.realtime, {
        method: "POST", signal, headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ model: model.id, providerOptions }),
    });
    if (!response.ok) throw new Error("Speech credential request failed.");
    const token = await response.json(); signal.throwIfAborted();
    if (typeof token.value !== "string" || !token.value.trim() || !Number.isFinite(token.expires_at)
        || token.expires_at <= Date.now() / 1000) throw new Error("Speech credential is missing or expired.");
    const protocol = openai || mistral ? undefined : speechProtocolFactories[provider](model.id.slice(provider.length + 1), options,
        token.providerMetadata?.cartesia?.cartesia_version);
    await args.context.resume(); args.signal.throwIfAborted();
    if (mistral) {
        let output: PcmSpeechOutput | undefined;
        const stop = () => output?.stop();
        let session: StreamingSpeechSession;
        try { session = await openMistralSpeechSession({ model: model.id, options, token: token.value, signal: args.signal,
            failed: stop, audio: (bytes, rate) => {
                output ??= new PcmSpeechOutput(rate, args.signal, args.started, args.context); output.push(bytes);
            } }); }
        catch (error) { stop(); throw error; }
        return { append: text => session.append(text), flush: () => session.flush(),
            async finish() { await session.finish(); await output?.drain(); },
            cancel() { session.cancel(); stop(); }, dispose() { session.dispose(); stop(); } };
    }
    const output = new PcmSpeechOutput(protocol?.sampleRate ?? openAiSpeechRate, args.signal, args.started, args.context);
    let session: StreamingSpeechSession;
    const playback = { token: token.value, signal: args.signal, audio: (bytes: Uint8Array) => output.push(bytes), failed: output.stop };
    try { session = openai ? await openOpenAiSpeechSession({ ...playback, model: model.id, options, instructions: args.speech.instructions })
        : await openStreamingSpeechSession({ ...playback, protocol: protocol! }); }
    catch (error) { output.stop(); throw error; }
    return { append: text => session.append(text), flush: () => session.flush(),
        async finish() { await session.finish(); await output.drain(); },
        cancel() { session.cancel(); output.stop(); }, dispose() { session.dispose(); output.stop(); } };
}
