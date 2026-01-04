import React, { useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { OpenAIITranscriptionConfigForm } from "../forms";
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
}

export const TranscriptionSettingsModal: React.FC<
    TranscriptionSettingsModalProps
> = ({
    open,
    providerMetadata,
    setProviderMetadata,
    enabledProviders,
    resetDefaults,
    onClose,
}) => {
        const theme = useTheme();
        const { t } = useTranslation();

        const defaultTab = "general";
        const [activeTab, setActiveTab] = useState(defaultTab);

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
                            />
                        </theme.Tab>
                    )}
                </theme.Tabs>
            </theme.Modal>
        );
    };
