import React, { useEffect, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import {
    FireworksTranscriptionConfigForm,
    GroqTranscriptionConfigForm,
    DeepgramTranscriptionConfigForm,
    ElevenLabsTranscriptionConfigForm,
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
} from "../forms";
import { SettingsActionButtons } from "../buttons";
import { useTheme } from "../theme/ThemeContext";
import { AzureTranscriptionConfigForm } from "../forms/providers/azure/AzureTranscriptionConfigForm";

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

        const defaultTab = enabledProviders?.[0].toLocaleLowerCase();
        const [activeTab, setActiveTab] = useState(defaultTab);

        useEffect(() => {
            setActiveTab(enabledProviders?.[0].toLocaleLowerCase())
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


                    {enabledProviders.includes("Mistral") && (
                        <theme.Tab eventKey="mistral" title="Mistral">
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
                                getSampleInfo={knownSpeakerSamples?.getSampleInfo}
                                onUploadSample={knownSpeakerSamples?.onUploadSample}
                                onClearSample={knownSpeakerSamples?.onClearSample}
                                onRenameSample={knownSpeakerSamples?.onRenameSample}
                                onPreviewSample={knownSpeakerSamples?.onPreviewSample}
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
