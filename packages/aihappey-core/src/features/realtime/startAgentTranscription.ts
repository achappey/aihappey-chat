import type { AiModel } from "aihappey-types";
import type { ChatConfig } from "../chat/context/ChatContext";
import { buildOperationHeaders, createCredentialScopedFetch } from "../provider-credentials/scopedRequest";
import { startRealtimeWebrtcSession } from "../transcriptions/realtime/startRealtimeWebrtcSession";
import { buildGoogleLiveTokenPayload } from "./googleLiveConfig";
import { AgentTranscriptionTurns } from "./agentTranscriptionTurns";
import { buildOpenAiAgentTranscriptionConfig } from "./openAiAgentTranscriptionConfig";

/** A chat-owned session reusing the transcription page's provider transports, not its storage/global state. */
export async function startAgentTranscription(args: {
    config: ChatConfig; model: AiModel; customHeaders?: Record<string, string>; signal: AbortSignal;
    /** Confirmed non-empty transcription for a new utterance, not microphone/VAD activity. */
    onStart: () => void; onPreview: (text: string) => void; onTurn: (text: string) => void;
    onEvent: (event: any) => void; onError: (error: Error) => void;
}) {
    const { model, config } = args;
    const connection = new AbortController();
    const signal = AbortSignal.any([args.signal, connection.signal]);
    const startupTimeout = setTimeout(() => connection.abort(new Error("Transcription connection timed out.")), 30_000);
    const provider = model.id.split("/")[0];
    let stream: MediaStream | undefined, context: AudioContext | undefined;
    let poll: ReturnType<typeof setInterval> | undefined;
    let session: Awaited<ReturnType<typeof startRealtimeWebrtcSession>> | undefined;
    let muted = false, stopped = false;
    const metadata = structuredClone(model.providerMetadata ?? {});
    if (provider === "openai") metadata.openai = buildOpenAiAgentTranscriptionConfig(metadata.openai, model.id);
    let manualOpenAiTurns = provider === "openai" && metadata.openai?.session?.audio?.input?.turn_detection == null;
    const turns = new AgentTranscriptionTurns(provider, {
        start: args.onStart, preview: args.onPreview, turn: args.onTurn,
    });
    const stop = async () => {
        if (stopped) return; stopped = true;
        turns.dispose(); clearInterval(poll); clearTimeout(startupTimeout);
        connection.abort();
        stream?.getTracks().forEach(track => track.stop());
        await context?.close(); await session?.stop();
        signal.removeEventListener("abort", abort);
    };
    const abort = () => { void stop(); };
    signal.addEventListener("abort", abort, { once: true });
    try {
        signal.throwIfAborted();
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
        if (signal.aborted) { stream.getTracks().forEach(track => track.stop()); signal.throwIfAborted(); }
        // One capture, shared with transport and activity detection. No microphone loopback.
        context = new AudioContext(); await context.resume();
        const analyser = context.createAnalyser(); analyser.fftSize = 1024;
        context.createMediaStreamSource(stream).connect(analyser);
        const samples = new Float32Array(analyser.fftSize);
        let speaking = false, loudAt = 0, candidateAt = 0;
        const pollActivity = () => {
            if (muted || signal.aborted || stopped) return;
            analyser.getFloatTimeDomainData(samples);
            const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
            const now = Date.now();
            if (rms > 0.025) {
                loudAt = now; candidateAt ||= now;
                if (!speaking && now - candidateAt >= 120) { speaking = true; turns.activity(true); }
            } else candidateAt = 0;
            if (speaking && now - loudAt > 600) {
                speaking = false; turns.activity(false);
                if (manualOpenAiTurns) session?.commitAudio?.();
            }
        };
        if (provider === "elevenlabs") metadata.elevenlabs = { ...metadata.elevenlabs, commit_strategy: "vad" };
        if (provider === "deepgram") metadata.deepgram = { interim_results: true, vad_events: true, endpointing: 500, ...metadata.deepgram };
        if (provider === "soniox") metadata.soniox = { ...metadata.soniox, enable_endpoint_detection: true };
        const headers = await buildOperationHeaders(config, { ...args.customHeaders, ...model.providerHeaders }, model.id);
        session = await startRealtimeWebrtcSession({ providerId: provider, selectedModel: model.id,
            microphoneStream: stream, signal, providerRealtimeMetadata: metadata,
            getEphemeralToken: async () => {
                signal.throwIfAborted();
                const options = provider === "google" ? { google: buildGoogleLiveTokenPayload({ modelId: model.id,
                    config: { responseModalities: ["TEXT"], inputAudioTranscription: metadata.google?.liveConnectConstraints?.config?.inputAudioTranscription ?? {} },
                    tokenConfig: metadata.google,
                }) } : metadata;
                const response = await createCredentialScopedFetch(config.fetch)(config.baseUrl + config.endpoints.realtime, {
                    method: "POST", signal, headers: { ...headers, "Content-Type": "application/json" },
                    body: JSON.stringify({ model: model.id, providerOptions: options }),
                });
                if (!response.ok) throw new Error(await response.text());
                const token = await response.json(); signal.throwIfAborted();
                // Older models may apply a provider default. Respect the negotiated session,
                // rather than double-committing turns already handled by server VAD.
                const input = token.providerMetadata?.openai?.session?.audio?.input;
                if (provider === "openai" && input && Object.hasOwn(input, "turn_detection")) manualOpenAiTurns = input.turn_detection == null;
                return token;
            }, events: {
                onEvent: event => { if (!signal.aborted && !stopped) { args.onEvent(event); if (!muted) turns.event(event); } },
                onError: (message, error) => { if (!signal.aborted && !stopped) args.onError(new Error(`${message}${error instanceof Error ? `: ${error.message}` : ""}`)); },
            },
        });
        clearTimeout(startupTimeout);
        if (signal.aborted || stopped) { await session.stop(); signal.throwIfAborted(); throw new Error("Transcription stopped during startup."); }
        poll = setInterval(pollActivity, 40);
        return { stop, setMuted(value: boolean) {
            muted = value; stream!.getAudioTracks().forEach(track => { track.enabled = !value; });
            if (value) { speaking = false; loudAt = 0; candidateAt = 0; turns.reset(); args.onPreview(""); }
        } };
    } catch (error) {
        const reason = signal.reason;
        await stop();
        throw !args.signal.aborted && reason instanceof Error ? reason : error;
    }
}
