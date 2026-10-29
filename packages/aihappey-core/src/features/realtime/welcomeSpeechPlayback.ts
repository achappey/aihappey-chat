import type { AiSpeech, ModelOption } from "aihappey-types";
import type { ChatConfig } from "../chat/context/ChatContext";
import { AgentAudioOutput } from "./agentSpeechPlayback";
import { openAgentSpeech } from "./openAgentSpeech";
import { supportsRealtimeSpeech } from "../speech/realtime/speechProtocol";
import { isOpenAiSpeechModelId, supportsOpenAiSpeech } from "../speech/realtime/openAiSpeechConfig";
import type { StreamingSpeechSession } from "../speech/realtime/streamingSpeechSession";

export const welcomeSpeechModel = (speech: AiSpeech | undefined, models: ModelOption[]) =>
    models.find(model => model.id === speech?.model?.id &&
        // Session tags select the direct socket, not HTTP speech eligibility (e.g. Gemini TTS).
        (model.type === "speech" || supportsOpenAiSpeech(model)));

/** One attempt per generation, not per render or text value. Owned only by the start page. */
export class WelcomeSpeechPlayback {
    private attempted = new WeakSet<AbortSignal>();
    private run?: AbortController;
    private stopped = false;
    cancel() { this.run?.abort(); this.run = undefined; }
    stop() { this.stopped = true; this.cancel(); }
    async play(generation: AbortSignal, play: (signal: AbortSignal) => Promise<void>) {
        if (this.stopped || generation.aborted || this.attempted.has(generation)) return;
        this.attempted.add(generation);
        this.cancel();
        const run = new AbortController(); this.run = run;
        try { await play(AbortSignal.any([generation, run.signal])); }
        catch { /* Welcome speech is optional; text and the main conversation are never affected. */ }
        finally { if (this.run === run) this.run = undefined; }
    }
}

/** A suspended autoplay attempt must not remain pending and play after a later user gesture. */
export async function resumeWelcomeAudio(context: AudioContext, signal: AbortSignal) {
    signal.throwIfAborted();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let abort: () => void = () => {};
    try {
        await Promise.race([context.resume(), new Promise<never>((_, reject) => {
            abort = () => reject(new DOMException("Welcome speech cancelled", "AbortError"));
            signal.addEventListener("abort", abort, { once: true });
            timer = setTimeout(() => reject(new DOMException("Autoplay unavailable", "NotAllowedError")), 1000);
        })]);
        signal.throwIfAborted();
        if (context.state !== "running") throw new DOMException("Autoplay unavailable", "NotAllowedError");
    } finally { clearTimeout(timer); signal.removeEventListener("abort", abort); }
}

export async function playRealtimeWelcomeSpeech(args: {
    config: ChatConfig; speech: AiSpeech; models: ModelOption[]; text: string;
    customHeaders?: Record<string, string>; signal: AbortSignal;
}) {
    const model = welcomeSpeechModel(args.speech, args.models);
    if (!model || !args.text.trim()) return;
    args.signal.throwIfAborted();
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return;
    const context: AudioContext = new Ctor();
    const output = new AgentAudioOutput(context);
    const stop = () => output.dispose();
    args.signal.addEventListener("abort", stop, { once: true });
    let session: StreamingSpeechSession | undefined;
    let played = false;
    try {
        // Check autoplay before credentials, synthesis or socket setup; a blocked attempt is never retried.
        await resumeWelcomeAudio(context, args.signal);
        if (supportsRealtimeSpeech(model) || supportsOpenAiSpeech(model)) {
            try {
                session = await openAgentSpeech({ ...args, context, started: () => { played = true; } });
                args.signal.throwIfAborted();
                session.append(args.text);
                await session.finish();
                return;
            } catch (error) {
                session?.cancel();
                if (args.signal.aborted || played || isOpenAiSpeechModelId(model.id)
                    || (error as any)?.name === "NotAllowedError") throw error;
            } finally { session?.dispose(); }
        }
        // The existing player prefers HTTP streaming, buffering only for unsupported transports/formats.
        await output.speak(args.config, args.customHeaders, args.speech, args.text, args.signal);
    } finally { args.signal.removeEventListener("abort", stop); stop(); }
}
