import React, { useEffect, useState } from "react";

import { useTranslation } from "aihappey-i18n";

import { SettingsActionButtons } from "../buttons";
import { useTheme } from "../theme/ThemeContext";
import {
    CohereRerankingConfig,
    CohereRerankingConfigForm,
    ContextualAIRerankingConfig,
    ContextualAIRerankingConfigForm,
    DeepInfraRerankingConfig,
    DeepInfraRerankingConfigForm,
    FireworksRerankingConfig,
    FireworksRerankingConfigForm,
    JinaRerankingConfig,
    JinaRerankingConfigForm,
    RerankingSettings,
    RerankingSettingsForm,
    TogetherRerankingConfig,
    TogetherRerankingConfigForm,
    VoyageAIRerankingConfig,
    VoyageAIRerankingConfigForm,
} from "../forms";

export interface RerankingSettingsModalProps {
    open: boolean;

    topN?: number;
    setTopN: (topN?: number) => void;
    enabledProviders: string[];
    providerMetadata: Record<string, any>;
    setProviderMetadata: (meta: Record<string, any>) => void;

    resetDefaults?: () => void;
    onClose: () => void;
}

export const RerankingSettingsModal: React.FC<RerankingSettingsModalProps> = ({
    open,
    topN,
    setTopN,
    providerMetadata,
    enabledProviders,
    setProviderMetadata,
    resetDefaults,
    onClose,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const defaultTab = "general";
    const [activeTab, setActiveTab] = useState(defaultTab);

    useEffect(() => {
        if (open) setActiveTab(defaultTab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const close = () => {
        onClose();
        setTimeout(() => setActiveTab(defaultTab), 200);
    };

    return (
        <theme.Modal
            show={open}
            onHide={close}
            title={t("rerankingSettings") ?? "Reranking settings"}
            actions={
                <SettingsActionButtons onClose={close} onRestoreDefaults={resetDefaults} />
            }
        >
            <theme.Tabs activeKey={activeTab} onSelect={setActiveTab}>
                <theme.Tab eventKey="general" title={t("general") ?? "General"}>
                    <RerankingSettingsForm
                        value={{ topN: topN } as RerankingSettings}
                        onChange={(next) => setTopN(next.topN)}
                        formTitle={t("general")}
                    />
                </theme.Tab>

                {enabledProviders.includes("Cohere") && (
                    <theme.Tab eventKey="cohere" title="Cohere">
                        <CohereRerankingConfigForm
                            config={(providerMetadata?.cohere ?? {}) as CohereRerankingConfig}
                            updateConfig={(cohere) =>
                                setProviderMetadata({
                                    ...providerMetadata,
                                    cohere,
                                })
                            }
                        />
                    </theme.Tab>
                )}

                {enabledProviders.includes("ContextualAI") && (
                    <theme.Tab eventKey="contextualai" title="ContextualAI">
                        <ContextualAIRerankingConfigForm
                            config={
                                (providerMetadata?.contextualai ?? {}) as ContextualAIRerankingConfig
                            }
                            updateConfig={(contextualai) =>
                                setProviderMetadata({
                                    ...providerMetadata,
                                    contextualai,
                                })
                            }
                        />
                    </theme.Tab>
                )}

                {enabledProviders.includes("DeepInfra") && (
                    <theme.Tab eventKey="deepinfra" title="DeepInfra">
                        <DeepInfraRerankingConfigForm
                            config={(providerMetadata?.deepinfra ?? {}) as DeepInfraRerankingConfig}
                            updateConfig={(deepinfra) =>
                                setProviderMetadata({
                                    ...providerMetadata,
                                    deepinfra,
                                })
                            }
                        />
                    </theme.Tab>
                )}

                {enabledProviders.includes("Fireworks") && (
                    <theme.Tab eventKey="fireworks" title="Fireworks">
                        <FireworksRerankingConfigForm
                            config={(providerMetadata?.fireworks ?? {}) as FireworksRerankingConfig}
                            updateConfig={(fireworks) =>
                                setProviderMetadata({
                                    ...providerMetadata,
                                    fireworks,
                                })
                            }
                        />
                    </theme.Tab>
                )}

                {enabledProviders.includes("Jina") && (
                    <theme.Tab eventKey="jina" title="Jina">
                        <JinaRerankingConfigForm
                            config={(providerMetadata?.jina ?? {}) as JinaRerankingConfig}
                            updateConfig={(jina) =>
                                setProviderMetadata({
                                    ...providerMetadata,
                                    jina,
                                })
                            }
                        />
                    </theme.Tab>
                )}

                {enabledProviders.includes("Together") && (
                    <theme.Tab eventKey="together" title="Together">
                        <TogetherRerankingConfigForm
                            config={(providerMetadata?.together ?? {}) as TogetherRerankingConfig}
                            updateConfig={(together) =>
                                setProviderMetadata({
                                    ...providerMetadata,
                                    together,
                                })
                            }
                        />
                    </theme.Tab>
                )}

                {enabledProviders.includes("VoyageAI") && (
                    <theme.Tab eventKey="voyageai" title="VoyageAI">
                        <VoyageAIRerankingConfigForm
                            config={(providerMetadata?.voyageai ?? {}) as VoyageAIRerankingConfig}
                            updateConfig={(voyageai) =>
                                setProviderMetadata({
                                    ...providerMetadata,
                                    voyageai,
                                })
                            }
                        />
                    </theme.Tab>
                )}

            </theme.Tabs>
        </theme.Modal>
    );
};


