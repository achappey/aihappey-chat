/** Canonical OpenAI transcription config. Never enables provider VAD on the caller's behalf. */
export function buildOpenAiAgentTranscriptionConfig(value: Record<string, any> = {}, modelId?: string) {
    const config = structuredClone(value);
    const session = { ...config.session, type: "transcription" };
    const input = { ...session.audio?.input };
    // Older forms stored this on session; OpenAI's current contract puts it on audio.input.
    const turnDetection = Object.hasOwn(input, "turn_detection") ? input.turn_detection : session.turn_detection;
    delete session.turn_detection;
    if (turnDetection == null) delete input.turn_detection;
    else input.turn_detection = turnDetection;
    // GPT-Live-Transcribe uses language hints, not the legacy singular language field.
    // Keep the portable form setting compatible with older transcription models.
    if (modelId?.split("/").at(-1)?.startsWith("gpt-live-transcribe") && input.transcription?.language !== undefined) {
        const { language, ...transcription } = input.transcription;
        const languages = String(language ?? "").split(",").map(value => value.trim()).filter(Boolean);
        input.transcription = { ...transcription, ...(languages.length ? { languages } : {}) };
    }
    session.audio = { ...session.audio, input };
    return { ...config, session };
}
