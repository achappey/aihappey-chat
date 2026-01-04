import type {
    SpeechProviderConstraintsMap,
} from "aihappey-components/src/forms/settings/speech";

/**
 * UI-only constraints for the generic speech settings form.
 * Keep this conservative: only add constraints when you're confident.
 */
export const SPEECH_PROVIDER_CONSTRAINTS: SpeechProviderConstraintsMap = {
    // OpenAI TTS supports a fixed set of voices and common formats; speed range is typical.
    openai: {
        voices: ["alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"],
        outputFormats: ["mp3", "wav", "opus", "aac", "flac", "pcm"],
        speed: { min: 0.25, max: 4, step: 0.05 },
        supportsLanguage: true,
        supportsInstructions: true,
    },
    groq: {
        voices: ["autumn", "diana", "hannah", "austin", "daniel", "troy", "fahad", "sultan", "lulwa", "noura"],
        outputFormats: ["wav"],
        speed: undefined,
        supportsLanguage: false,
        supportsInstructions: false,
    },
};

