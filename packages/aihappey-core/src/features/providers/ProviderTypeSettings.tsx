import React from "react";
import * as forms from "aihappey-components";
import { store, useAppStore } from "aihappey-state";
import { useChatContext } from "../chat/context/ChatContext";
import { GoogleChatConfig } from "../provider-config/google/GoogleChatConfig";

// Keep this list aligned with the provider forms already exposed in the feature settings pages.
// Providers without a form for a model type do not get a settings switch.
const providerForms: Record<string, Record<string, React.ComponentType<any>>> = {
    language: {
        abliteration: forms.AbliterationChatConfigForm, akumi: forms.AkumiChatConfigForm,
        anthropic: forms.AnthropicChatConfigForm, apertis: forms.ApertisChatConfigForm,
        baseten: forms.BasetenChatConfigForm, blackbox: forms.BlackboxChatConfigForm,
        browseruse: forms.BrowserUseChatConfigForm, brave: forms.BraveChatConfigForm,
        cerebras: forms.CerebrasChatConfigForm, cohere: forms.CohereChatConfigForm,
        copilot: forms.CopilotChatConfigForm, cortecs: forms.CortecsChatConfigForm,
        deepseek: forms.DeepSeekChatConfigForm, depaza: forms.DepazaChatConfigForm,
        google: GoogleChatConfig, groq: forms.GroqChatConfigForm,
        inworld: forms.InworldChatConfigForm, interfaze: forms.InterfazeChatConfigForm,
        jina: forms.JinaChatConfigForm, linkup: forms.LinkupChatConfigForm,
        maritacaai: forms.MaritacaAIChatConfigForm, mireye: forms.MireyeChatConfigForm,
        mistral: forms.MistralChatConfigForm, neuralwatt: forms.NeuralwattChatConfigForm,
        ninjachat: forms.NinjaChatChatConfigForm, openai: forms.OpenAIChatConfigForm,
        openhands: forms.OpenHandsChatConfigForm, openrouter: forms.OpenRouterChatConfigForm,
        perplexity: forms.PerplexityChatConfigForm, pollinations: forms.PollinationsChatConfigForm,
        poolside: forms.PoolsideChatConfigForm, requesty: forms.RequestyChatConfigForm,
        sambanova: forms.SambanovaChatConfigForm, tembo: forms.TemboChatConfigForm,
        tinyfish: forms.TinyFishChatConfigForm, together: forms.TogetherChatConfigForm,
        upstage: forms.UpstageChatConfigForm, venice: forms.VeniceChatConfigForm,
        webcrawlerapi: forms.WebCrawlerAPIChatConfigForm, spacexai: forms.XAIChatConfigForm,
        xiaomimimo: forms.XiaomiMIMOChatConfigForm, zai: forms.ZaiChatConfigForm,
    },
    image: {
        fireworks: forms.FireworksImageConfigForm, hyperbolic: forms.HyperbolicImageConfigForm,
        nebius: forms.NebiusImageConfigForm, minimax: forms.MiniMaxImageConfigForm,
        openai: forms.OpenAIImageConfigForm, spacexai: forms.XAIImageConfigForm,
        pollinations: forms.PollinationsImageConfigForm, runway: forms.RunwayImageConfigForm,
        stabilityai: forms.StabilityAIImageForm, together: forms.TogetherImageConfigForm,
        verda: forms.VerdaImageConfigForm, freepik: forms.FreepikImageConfigForm,
    },
    speech: {
        async: forms.AsyncSpeechConfigForm, audixa: forms.AudixaSpeechConfigForm,
        deepgram: forms.DeepgramSpeechConfigForm, deepinfra: forms.DeepInfraSpeechConfigForm,
        freepik: forms.FreepikSpeechConfigForm, runway: forms.RunwaySpeechConfigForm,
        elevenlabs: forms.ElevenLabsSpeechConfigForm, google: forms.GoogleSpeechConfigForm,
        groq: forms.GroqSpeechConfigForm, minimax: forms.MiniMaxSpeechConfigForm,
        novita: forms.NovitaSpeechConfigForm, openai: forms.OpenAISpeechConfigForm,
        speechify: forms.SpeechifySpeechConfigForm, stabilityai: forms.StabilityAISpeechConfigForm,
        together: forms.TogetherSpeechConfigForm, resembleai: forms.ResembleAISpeechConfigForm,
        murfai: forms.MurfAISpeechConfigForm, stepfun: forms.StepFunSpeechConfigForm,
    },
    transcription: {
        azure: forms.AzureTranscriptionConfigForm, deepgram: forms.DeepgramTranscriptionConfigForm,
        deepinfra: forms.DeepInfraTranscriptionConfigForm, elevenlabs: forms.ElevenLabsTranscriptionConfigForm,
        assemblyai: forms.AssemblyAITranscriptionConfigForm, fireworks: forms.FireworksTranscriptionConfigForm,
        groq: forms.GroqTranscriptionConfigForm, cohere: forms.CohereTranscriptionConfigForm,
        google: forms.GoogleRealtimeTranscriptionConfigForm, mistral: forms.MistralTranscriptionConfigForm,
        novita: forms.NovitaTranscriptionConfigForm, openai: forms.OpenAIITranscriptionConfigForm,
        spacexai: forms.XAITranscriptionConfigForm, sambanova: forms.SambanovaTranscriptionConfigForm,
        scaleway: forms.ScalewayTranscriptionConfigForm, zai: forms.ZaiTranscriptionConfigForm,
        telnyx: forms.TelnyxTranscriptionConfigForm, resembleai: forms.ResembleAITranscriptionConfigForm,
        gladia: forms.GladiaTranscriptionConfigForm,
    },
    reranking: {
        cohere: forms.CohereRerankingConfigForm, deepinfra: forms.DeepInfraRerankingConfigForm,
        fireworks: forms.FireworksRerankingConfigForm, jina: forms.JinaRerankingConfigForm,
        together: forms.TogetherRerankingConfigForm, voyageai: forms.VoyageAIRerankingConfigForm,
    },
};

export const hasProviderTypeSettings = (providerKey: string, type: string) =>
    !!providerForms[type]?.[providerKey.toLowerCase()];

const metadataByType: Record<string, [string, string]> = {
    language: ["providerMetadata", "setProviderMetadata"],
    image: ["providerImageMetadata", "setProviderImageMetadata"],
    speech: ["providerSpeechMetadata", "setProviderSpeechMetadata"],
    transcription: ["providerTranscriptionMetadata", "setProviderTranscriptionMetadata"],
    reranking: ["providerRerankingMetadata", "setProviderRerankingMetadata"],
};

export const ProviderTypeSettings: React.FC<{ providerKey: string; type: string; models?: any[] }> = ({ providerKey, type, models }) => {
    const key = providerKey.toLowerCase();
    const Form = providerForms[type]?.[key];
    const { config: chatConfig } = useChatContext();
    const metadata = useAppStore((state) => (state as any)[metadataByType[type]?.[0]]) as Record<string, any> | undefined;
    const realtime = useAppStore((state) => state.providerRealtimeMetadata) as Record<string, any> | undefined;
    const headers = useAppStore((state) => state.providerHeaders) as Record<string, Record<string, string>> | undefined;
    if (!Form) return null;

    // Read the latest store snapshot on every edit so an open modal cannot overwrite changes
    // made to other providers in the meantime. All feature settings continue to use these stores.
    const update = (field: string, setter: string, entry: string, value: any) => {
        const state = store.getState() as any;
        const next = { ...(state[field] ?? {}) };
        if (value === undefined && field === "providerHeaders") delete next[entry];
        else next[entry] = value;
        state[setter](next);
    };
    const [field, setter] = metadataByType[type];
    const entry = type === "transcription" && key === "spacexai" ? "xai" : key;
    const updateConfig = (value: any) => update(field, setter, entry, value);
    const updateRealtimeConfig = (value: any) => update("providerRealtimeMetadata", "setProviderRealtimeMetadata", key, value);
    const updateHeaders = (value: Record<string, string> | undefined) => update("providerHeaders", "setProviderHeaders", key, value);
    const config = type === "transcription" && key === "google"
        ? realtime?.google ?? {}
        : metadata?.[entry] ?? (type === "image" && key === "minimax" ? { prompt_optimizer: false } :
            type === "image" && key === "spacexai" ? { quality: "auto" } : {});

    if (type === "language" && key === "google") return <GoogleChatConfig google={config} updateGoogle={updateConfig} />;

    const extra: Record<string, any> = {};
    if (type === "language") {
        if (["anthropic", "baseten", "interfaze", "openai", "openrouter", "requesty"].includes(key)) {
            extra.headers = headers?.[key] ?? {};
            extra.updateHeaders = updateHeaders;
        }
        if (["openrouter", "requesty"].includes(key)) extra.appTitle = chatConfig?.appName;
        if (key === "perplexity") extra.models = models;
    }
    if (type === "transcription") {
        if (["assemblyai", "elevenlabs", "openai"].includes(key)) {
            extra.realtimeConfig = realtime?.[key] ?? {};
            extra.updateRealtimeConfig = updateRealtimeConfig;
        }
        if (key === "google") return <Form config={config} updateConfig={updateRealtimeConfig} />;
    }
    return <Form config={config} updateConfig={updateConfig} {...extra} />;
};
