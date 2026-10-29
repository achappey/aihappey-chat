import React, { useEffect, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import {
    FireworksTranscriptionConfigForm,
    GroqTranscriptionConfigForm,
    DeepgramTranscriptionConfigForm,
    ElevenLabsTranscriptionConfigForm,
    AssemblyAITranscriptionConfigForm,
    MistralTranscriptionConfigForm,
    NovitaTranscriptionConfigForm,
    OpenAIITranscriptionConfigForm,
    SambanovaTranscriptionConfigForm,
    ScalewayTranscriptionConfigForm,
    TelnyxTranscriptionConfigForm,
    ZaiTranscriptionConfigForm,
    ResembleAITranscriptionConfigForm,
    GladiaTranscriptionConfigForm,
    DeepInfraTranscriptionConfigForm,
    XAITranscriptionConfigForm,
    CohereTranscriptionConfigForm,
    GoogleRealtimeTranscriptionConfigForm,
} from "../forms";
import { SettingsActionButtons } from "../buttons";
import { useTheme } from "../theme/ThemeContext";
import { AzureTranscriptionConfigForm } from "../forms/providers/azure/AzureTranscriptionConfigForm";
import { MistralRealtimeTranscriptionConfigForm } from "../forms/providers/mistral/MistralRealtimeTranscriptionConfigForm";

const getDefaultProviderTab = (enabledProviders?: string[]): string => {
    const firstProvider = enabledProviders?.[0];
    return typeof firstProvider === "string"
        ? (firstProvider.toLowerCase() === "xai" ? "spacexai" : firstProvider.toLowerCase())
        : "";
};

/** Shared by the transcription page and the agent editor; configuration is entirely caller-owned. */
export const CartesiaRealtimeTranscriptionConfigForm = ({ config, updateConfig }: {
    config: Record<string, any>; updateConfig: (config: Record<string, any>) => void;
}) => {
    const theme = useTheme();
    const { t } = useTranslation();
    return <theme.Card size="small" title="Realtime speech to text" description="Select the auto or manual model in the transcription model selector. Audio is captured as mono PCM16 at 16 kHz.">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <theme.Input id="cartesia-stt-keyterms" label="Keyterms (comma-separated)" value={(config.keyterm ?? []).join(", ")}
                onChange={event => updateConfig({ ...config, keyterm: event.target.value.split(",").map((value: string) => value.trim()).filter(Boolean) })} />
            <theme.Input id="cartesia-stt-language" label="Language (ink-whisper manual only)" value={config.language ?? ""}
                onChange={event => updateConfig({ ...config, language: event.target.value || undefined })} />
            {(["turn_start_threshold", "turn_eager_end_threshold", "turn_end_threshold", "turn_end_timeout_ms", "min_volume", "max_silence_duration_secs"] as const).map(key => (
                <theme.Input key={key} id={`cartesia-${key}`} label={key.replaceAll("_", " ")} type="number" step={key.includes("ms") ? 1 : 0.01}
                    value={config[key] ?? ""} onChange={event => updateConfig({ ...config, [key]: event.target.value === "" ? undefined : Number(event.target.value) })} />
            ))}
        </div>
    </theme.Card>;
};

export interface TranscriptionSettingsModalProps {
    open: boolean;

    providerMetadata: Record<string, any>;
    setProviderMetadata: (meta: Record<string, any>) => void;

    realtimeProviderMetadata: Record<string, any>;
    setRealtimeProviderMetadata: (meta: Record<string, any>) => void;

    enabledProviders: string[];

    resetDefaults?: () => void;
    onEditProviderKeys?: () => void;
    onClose: () => void;

    /** Optional known-speaker sample binding (implemented in aihappey-core). */
    knownSpeakerSamples?: {
        getSampleInfo?: (speakerName: string) => { exists: boolean; tagLabel?: string };
        onUploadSample?: (speakerName: string, files: File[]) => Promise<void> | void;
        onClearSample?: (speakerName: string) => Promise<void> | void;
        onRenameSample?: (fromSpeakerName: string, toSpeakerName: string) => Promise<void> | void;
        onPreviewSample?: (speakerName: string) => Promise<void> | void;
    };
}

export const TranscriptionSettingsModal: React.FC<
    TranscriptionSettingsModalProps
> = ({
    open,
    providerMetadata,
    setProviderMetadata,
    enabledProviders,
    resetDefaults,
    realtimeProviderMetadata,
    setRealtimeProviderMetadata,
    knownSpeakerSamples,
    onClose,
}) => {
        const theme = useTheme();
        const { t } = useTranslation();

        const defaultTab = getDefaultProviderTab(enabledProviders);
        const [activeTab, setActiveTab] = useState(defaultTab);

        useEffect(() => {
            setActiveTab(getDefaultProviderTab(enabledProviders))
        }, [enabledProviders]);

        const close = () => {
            onClose();
            setTimeout(() => setActiveTab(defaultTab), 200);
        };

        return (
            <theme.Modal
                show={open}
                onHide={close}
                title={t("transcriptionSettings")}
                actions={
                    <SettingsActionButtons
                        onClose={close}
                        onRestoreDefaults={resetDefaults}
                    />
                }
            >
                <theme.Tabs activeKey={activeTab} onSelect={setActiveTab}>

                    {enabledProviders.includes("Azure") && (
                        <theme.Tab eventKey="azure" title="Azure">
                            <AzureTranscriptionConfigForm
                                config={providerMetadata.azure ?? {}}
                                updateConfig={(azure) =>
                                    setProviderMetadata({
                                        ...providerMetadata,
                                        azure,
                                    })
                                }
                            />
                        </theme.Tab>
                    )}

                    {enabledProviders.includes("Deepgram") && (
                        <theme.Tab eventKey="deepgram" title="Deepgram">
                            <DeepgramTranscriptionConfigForm
                                config={providerMetadata.deepgram ?? {}}
                                updateConfig={(deepgram) =>
                                    setProviderMetadata({
                                        ...providerMetadata,
                                        deepgram,
                                    })
                                }
                            />
                        </theme.Tab>
                    )}

                    {enabledProviders.includes("DeepInfra") && (
                        <theme.Tab eventKey="deepinfra" title="DeepInfra">
                            <DeepInfraTranscriptionConfigForm
                                config={providerMetadata.deepinfra ?? {}}
                                updateConfig={(deepinfra) =>
                                    setProviderMetadata({
                                        ...providerMetadata,
                                        deepinfra,
                                    })
                                }
                            />
                        </theme.Tab>
                    )}

                    {enabledProviders.includes("ElevenLabs") && (
                        <theme.Tab eventKey="elevenlabs" title="ElevenLabs">
                            <ElevenLabsTranscriptionConfigForm
                                config={providerMetadata.elevenlabs ?? {}}
                                updateConfig={(elevenlabs) =>
                                    setProviderMetadata({
                                        ...providerMetadata,
                                        elevenlabs,
                                    })
                                }
                                realtimeConfig={realtimeProviderMetadata.elevenlabs ?? {}}
                                updateRealtimeConfig={(elevenlabs) =>
                                    setRealtimeProviderMetadata({
                                        ...realtimeProviderMetadata,
                                        elevenlabs,
                                    })
                                }
                            />
                        </theme.Tab>
                    )}

                    {enabledProviders.includes("AssemblyAI") && (
                        <theme.Tab eventKey="assemblyai" title="AssemblyAI">
                            <AssemblyAITranscriptionConfigForm
                                config={providerMetadata.assemblyai ?? {}}
                                updateConfig={(assemblyai) =>
                                    setProviderMetadata({
                                        ...providerMetadata,
                                        assemblyai,
                                    })
                                }
                                realtimeConfig={realtimeProviderMetadata.assemblyai ?? {}}
                                updateRealtimeConfig={(assemblyai) =>
                                    setRealtimeProviderMetadata({
                                        ...realtimeProviderMetadata,
                                        assemblyai,
                                    })
                                }
                            />
                        </theme.Tab>
                    )}

                    {enabledProviders.includes("Cartesia") && (
                        <theme.Tab eventKey="cartesia" title="Cartesia">
                            <CartesiaRealtimeTranscriptionConfigForm config={realtimeProviderMetadata.cartesia ?? {}}
                                updateConfig={cartesia => setRealtimeProviderMetadata({ ...realtimeProviderMetadata, cartesia })} />
                        </theme.Tab>
                    )}

                    {enabledProviders.includes("Fireworks") && (
                        <theme.Tab eventKey="fireworks" title="Fireworks">
                            <FireworksTranscriptionConfigForm
                                config={providerMetadata.fireworks ?? {}}
                                updateConfig={(fireworks) =>
                                    setProviderMetadata({
                                        ...providerMetadata,
                                        fireworks,
                                    })
                                }
                            />
                        </theme.Tab>
                    )}


                    {enabledProviders.includes("Groq") && (
                        <theme.Tab eventKey="groq" title="Groq">
                            <GroqTranscriptionConfigForm
                                config={providerMetadata.groq ?? {}}
                                updateConfig={(groq) =>
                                    setProviderMetadata({
                                        ...providerMetadata,
                                        groq,
                                    })
                                }
                            />
                        </theme.Tab>
                    )}


                    {enabledProviders.includes("Cohere") && (
                        <theme.Tab eventKey="cohere" title="Cohere">
                            <CohereTranscriptionConfigForm
                                config={providerMetadata.cohere ?? {}}
                                updateConfig={(cohere) =>
                                    setProviderMetadata({
                                        ...providerMetadata,
                                        cohere,
                                    })
                                }
                            />
                        </theme.Tab>
                    )}

                    {enabledProviders.includes("Google") && (
                        <theme.Tab eventKey="google" title="Google">
                            <GoogleRealtimeTranscriptionConfigForm
                                // Deliberately separate from providerMetadata.google:
                                // that object is reserved for non-realtime transcription.
                                config={realtimeProviderMetadata.google ?? {}}
                                updateConfig={(google) =>
                                    setRealtimeProviderMetadata({
                                        ...realtimeProviderMetadata,
                                        google,
                                    })
                                }
                            />
                        </theme.Tab>
                    )}


                    {enabledProviders.includes("Mistral") && (
                        <theme.Tab eventKey="mistral" title="Mistral">
                            <MistralRealtimeTranscriptionConfigForm config={realtimeProviderMetadata.mistral ?? {}}
                                updateConfig={mistral => setRealtimeProviderMetadata({ ...realtimeProviderMetadata, mistral })} />
                            <MistralTranscriptionConfigForm
                                config={providerMetadata.mistral ?? {}}
                                updateConfig={(mistral) =>
                                    setProviderMetadata({
                                        ...providerMetadata,
                                        mistral,
                                    })
                                }
                            />
                        </theme.Tab>
                    )}

                    {enabledProviders.includes("Novita") && (
                        <theme.Tab eventKey="novita" title="Novita">
                            <NovitaTranscriptionConfigForm
                                config={providerMetadata.novita ?? {}}
                                updateConfig={(novita) =>
                                    setProviderMetadata({
                                        ...providerMetadata,
                                        novita,
                                    })
                                }
                            />
                        </theme.Tab>
                    )}


                    {enabledProviders.includes("OpenAI") && (
                        <theme.Tab eventKey="openai" title="OpenAI">
                            <OpenAIITranscriptionConfigForm
                                config={providerMetadata.openai ?? {}}
                                updateConfig={(openai) =>
                                    setProviderMetadata({
                                        ...providerMetadata,
                                        openai,
                                    })
                                }
                                realtimeConfig={realtimeProviderMetadata.openai ?? {}}
                                updateRealtimeConfig={(openai) =>
                                    setRealtimeProviderMetadata({
                                        ...realtimeProviderMetadata,
                                        openai,
                                    })
                                }
                            />
                        </theme.Tab>
                    )}

                    {(enabledProviders.includes("SpaceXAI") || enabledProviders.includes("xAI")) && (
                        <theme.Tab eventKey="spacexai" title="SpaceXAI">
                            <XAITranscriptionConfigForm
                                config={providerMetadata.spacexai ?? providerMetadata.xai ?? {}}
                                updateConfig={(spacexai) => {
                                    const { xai, ...metadata } = providerMetadata;
                                    setProviderMetadata({ ...metadata, spacexai });
                                }}
                            />
                        </theme.Tab>
                    )}
 
 
                    {enabledProviders.includes("SambaNova") && (
                        <theme.Tab eventKey="sambanova" title="SambaNova">
                            <SambanovaTranscriptionConfigForm
                                config={providerMetadata.sambanova ?? {}}
                                updateConfig={(sambanova) =>
                                    setProviderMetadata({
                                        ...providerMetadata,
                                        sambanova,
                                    })
                                }
                            />
                        </theme.Tab>
                    )}


                    {enabledProviders.includes("Scaleway") && (
                        <theme.Tab eventKey="scaleway" title="Scaleway">
                            <ScalewayTranscriptionConfigForm
                                config={providerMetadata.scaleway ?? {}}
                                updateConfig={(scaleway) =>
                                    setProviderMetadata({
                                        ...providerMetadata,
                                        scaleway,
                                    })
                                }
                            />
                        </theme.Tab>
                    )}


                    {enabledProviders.includes("Zai") && (
                        <theme.Tab eventKey="zai" title="Zai">
                            <ZaiTranscriptionConfigForm
                                config={providerMetadata.zai ?? {}}
                                updateConfig={(zai) =>
                                    setProviderMetadata({
                                        ...providerMetadata,
                                        zai,
                                    })
                                }
                            />
                        </theme.Tab>
                    )}


                    {enabledProviders.includes("Telnyx") && (
                        <theme.Tab eventKey="telnyx" title="Telnyx">
                            <TelnyxTranscriptionConfigForm
                                config={providerMetadata.telnyx ?? {}}
                                updateConfig={(telnyx) =>
                                    setProviderMetadata({
                                        ...providerMetadata,
                                        telnyx,
                                    })
                                }
                            />
                        </theme.Tab>
                    )}

                    {enabledProviders.includes("ResembleAI") && (
                        <theme.Tab eventKey="resembleai" title="ResembleAI">
                            <ResembleAITranscriptionConfigForm
                                config={providerMetadata.resembleai ?? {}}
                                updateConfig={(resembleai) =>
                                    setProviderMetadata({
                                        ...providerMetadata,
                                        resembleai,
                                    })
                                }
                            />
                        </theme.Tab>
                    )}

                    {enabledProviders.includes("Gladia") && (
                        <theme.Tab eventKey="gladia" title="Gladia">
                            <GladiaTranscriptionConfigForm
                                config={providerMetadata.gladia ?? {}}
                                updateConfig={(gladia) =>
                                    setProviderMetadata({
                                        ...providerMetadata,
                                        gladia,
                                    })
                                }
                            />
                        </theme.Tab>
                    )}



                </theme.Tabs>
            </theme.Modal>
        );
    };
