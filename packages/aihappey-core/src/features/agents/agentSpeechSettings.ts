import type { AiSpeech } from "aihappey-types";

const clean = (value?: string | null) => value?.trim() || undefined;
const formatNames: Record<string, string> = {
    "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/wav": "wav", "audio/wave": "wav", "audio/x-wav": "wav",
    "audio/opus": "opus", "audio/aac": "aac", "audio/flac": "flac", "audio/pcm": "pcm", "audio/pcm_s16le": "pcm",
    "audio/ogg": "ogg", "audio/webm": "webm", "audio/mp4": "m4a",
};
export const agentSpeechFormatName = (type?: string | null) => {
    const value = clean(type)?.toLowerCase();
    return value ? formatNames[value] ?? value : undefined;
};

/** Only explicit agent settings are sent; never use the standalone Speech page's defaults. */
export function agentSpeechSettings(speech?: AiSpeech | null) {
    if (speech?.speed != null && (!Number.isFinite(speech.speed) || speech.speed <= 0)) throw new Error("Speech speed must be positive and finite.");
    const type = clean(speech?.outputFormat?.type);
    const rate = speech?.outputFormat?.rate ?? undefined;
    if (rate !== undefined && (!Number.isInteger(rate) || rate <= 0 || !type)) throw new Error("Speech sample rate requires a format and a positive integer.");
    return { voice: clean(speech?.voice), instructions: clean(speech?.instructions), language: clean(speech?.language),
        speed: speech?.speed ?? undefined, outputFormat: type ? { type, ...(rate === undefined ? {} : { rate }) } : undefined };
}

/** Override equivalent native fields on a clone, retaining all opaque advanced options. */
export function agentSpeechProviderOptions(speech: AiSpeech): Record<string, any> {
    const provider = speech.model?.id.split("/")[0] ?? "";
    const options = structuredClone(speech.model?.providerMetadata?.[provider] ?? {});
    const settings = agentSpeechSettings(speech);
    const replace = (keys: string[], value: unknown, target = options) => {
        if (value === undefined) return;
        for (const key of keys) if (Object.prototype.hasOwnProperty.call(target, key)) target[key] = value;
    };
    replace(["voice", "voiceId", "voice_id", "speaker", "speaker_id"], settings.voice);
    replace(["speed", "speakingRate", "speaking_rate"], settings.speed);
    replace(["instructions"], settings.instructions);
    replace(["language", "languageCode", "language_code"], settings.language);
    replace(["response_format", "outputFormat"], agentSpeechFormatName(settings.outputFormat?.type));
    replace(["sampleRate", "sample_rate", "sample_rate_hertz"], settings.outputFormat?.rate);
    for (const key of ["voice_setting", "voiceSetting", "generation_config"]) {
        const nested = options[key];
        if (!nested || typeof nested !== "object" || Array.isArray(nested)) continue;
        replace(["voice_id", "voiceId", "id"], settings.voice, nested);
        replace(["speed"], settings.speed, nested);
    }
    return options;
}

/** WebSocket transports decode raw PCM, regardless of HTTP encoding preferences. */
export function agentSpeechSocketOptions(speech: AiSpeech) {
    const settings = agentSpeechSettings(speech);
    return { ...agentSpeechProviderOptions(speech),
        ...(settings.voice ? { voice: settings.voice } : {}),
        ...(settings.speed !== undefined ? { speed: settings.speed } : {}),
        ...(settings.language ? { language: settings.language } : {}),
        ...(settings.outputFormat?.rate !== undefined ? { sampleRate: settings.outputFormat.rate } : {}),
    };
}

export const hasValidAgentSpeech = (speech?: AiSpeech | null) => {
    try { agentSpeechSettings(speech); return true; } catch { return false; }
};
