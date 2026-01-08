import React, { useEffect, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import {
    FireworksTranscriptionConfigForm,
    GroqTranscriptionConfigForm,
    ElevenLabsTranscriptionConfigForm,
    MistralTranscriptionConfigForm,
    NovitaTranscriptionConfigForm,
    OpenAIITranscriptionConfigForm,
    SambanovaTranscriptionConfigForm,
    ScalewayTranscriptionConfigForm,
    ZaiTranscriptionConfigForm,
} from "../forms";
import { SettingsActionButtons } from "../buttons";
import { useTheme } from "../theme/ThemeContext";

export interface TranscriptionSettingsModalProps {
    open: boolean;

    providerMetadata: Record<string, any>;
    setProviderMetadata: (meta: Record<string, any>) => void;

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



                </theme.Tabs>
            </theme.Modal>
        );
    };
