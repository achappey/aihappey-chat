import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { getModelProviderKey, getModelTypeIcon, getModelTypeLabelKey, type IconToken, type ModelOption, type Provider, type ProviderUrls } from "aihappey-types";

import { ModelCard } from "../cards/ModelCard";
import { OpenLinkButton } from "../buttons/OpenLinkButton";
import { useTheme } from "../theme/ThemeContext";

export type ProviderDetailModalProps = {
    open: boolean;
    onClose: () => void;

    providerKey: string;
    providerName: string;
    providerUrls?: ProviderUrls;
    providerDescription?: string;
    providerImage?: string;
    providerExperimental?: boolean;

    modelTypes?: string[];
    models?: ModelOption[];
    isModelFavorite?: (model: ModelOption) => boolean;
    onToggleModelFavorite?: (model: ModelOption) => void;

    provider?: Provider;
    /** Only types with an existing provider form should appear here. */
    renderProviderSettings?: (type: string) => React.ReactNode;
    providerSettingsTypes?: string[];
    size?: "small" | "medium" | "large";
};

type ProviderLinkConfig = {
    key: keyof ProviderUrls;
    icon: IconToken;
    labelKey: string;
};

const PROVIDER_LINKS: ProviderLinkConfig[] = [
    { key: "homepage", icon: "globe", labelKey: "website" },
    { key: "pricing", icon: "pricing", labelKey: "pricing" },
    { key: "docs", icon: "docs", labelKey: "documentation" },
    { key: "console", icon: "console", labelKey: "console" },
    { key: "termsOfService", icon: "terms", labelKey: "terms" },
    { key: "privacyPolicy", icon: "privacy", labelKey: "privacy" },
];

const uniq = (values: string[]) => Array.from(new Set(values));

const visuallyHidden: React.CSSProperties = {
    position: "absolute", width: 1, height: 1, padding: 0, margin: -1,
    overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0,
};

const ProviderModelTypeContent: React.FC<{
    models: ModelOption[];
    provider?: Provider;
    isModelFavorite?: (model: ModelOption) => boolean;
    onToggleModelFavorite?: (model: ModelOption) => void;
    openModelInNewWindow: (model: ModelOption) => void;
    settings?: React.ReactNode;
}> = ({ models, provider, isModelFavorite, onToggleModelFavorite, openModelInNewWindow, settings }) => {
    const { t } = useTranslation();
    const { Tabs, Tab, Alert } = useTheme();
    const [view, setView] = useState("models");
    const cards = (
        <div style={{ paddingTop: 12 }}>
            {models.length === 0 ? <Alert variant="warning">{t("none")}</Alert> : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                    {models.map((model) => (
                        <div key={model.id}>
                            <ModelCard
                                model={model}
                                provider={provider}
                                onLaunch={MODEL_LAUNCH_BY_TYPE[model.type] ? () => openModelInNewWindow(model) : undefined}
                                launchIcon={MODEL_LAUNCH_BY_TYPE[model.type]?.icon}
                                isFavorite={isModelFavorite?.(model) ?? false}
                                onToggleFavorite={onToggleModelFavorite ? () => onToggleModelFavorite(model) : undefined}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    if (!settings) return cards;
    return (
        <Tabs vertical activeKey={view} onSelect={setView} style={{ width: "100%", minWidth: 0 }}>
            <Tab eventKey="models" icon="cardList" title={<span style={visuallyHidden}>{t("models")}</span>}>
                {cards}
            </Tab>
            <Tab eventKey="settings" icon="settings" title={<span style={visuallyHidden}>{t("settings")}</span>}>
                <div style={{ minWidth: 0, paddingTop: 12 }}>{view === "settings" ? settings : null}</div>
            </Tab>
        </Tabs>
    );
};

const MODEL_LAUNCH_BY_TYPE: Partial<Record<string, { icon: IconToken; path: string }>> = {
    language: { icon: "chat", path: "/" },
    video: { icon: "video", path: "/videos" },
    speech: { icon: "speech", path: "/speech" },
    transcription: { icon: "transcription", path: "/transcriptions" },
    reranking: { icon: "reranking", path: "/reranking" },
    image: { icon: "image", path: "/images" },
};

export const ProviderDetailModal: React.FC<ProviderDetailModalProps> = ({
    open,
    onClose,
    providerKey,
    providerName,
    providerUrls,
    providerDescription,
    providerImage,
    providerExperimental,
    modelTypes,
    models,
    isModelFavorite,
    onToggleModelFavorite,
    provider,
    renderProviderSettings,
    providerSettingsTypes,
    size = "large",
}) => {
    const { t } = useTranslation();
    const { Modal, Button, Tabs, Tab, Image, Alert, Card } = useTheme();

    const providerHost = useMemo(() => {
        if (!providerUrls?.homepage) return "";

        try {
            return new URL(providerUrls?.homepage).hostname;
        } catch {
            return providerUrls?.homepage;
        }
    }, [providerUrls]);
    const providerModels = useMemo(
        () => (models ?? []).filter((m) =>
            getModelProviderKey(m.id, m) === providerKey,
        ),
        [models, providerKey]
    );

    const supportedModelTypes = useMemo(() => {
        const discovered = providerModels.map((m) => m.type).filter(Boolean);
        const source = modelTypes?.length ? modelTypes : discovered;
        const discoveredSet = new Set(discovered);
        return uniq(source).filter((type) => discoveredSet.has(type));
    }, [modelTypes, providerModels]);

    const modelGroups = useMemo(() => {
        const groups = new Map<string, ModelOption[]>();
        for (const type of supportedModelTypes) {
            groups.set(
                type,
                providerModels.filter((m) => m.type === type)
            );
        }
        return groups;
    }, [providerModels, supportedModelTypes]);

    const defaultTab = "general";
    const [activeTab, setActiveTab] = useState<string>(defaultTab);

    useEffect(() => {
        if (!open) return;
        setActiveTab(defaultTab);
    }, [open]);

    const getModelTypeLabel = (type: string, count: number) => {
        const translated = t(getModelTypeLabelKey(type));
        return (translated && translated.trim().length > 0 ? translated : type)
            + ` (${count})`;
    };

    const openModelInNewWindow = (model: ModelOption) => {
        const launchConfig = MODEL_LAUNCH_BY_TYPE[model.type];
        if (!launchConfig) return;

        window.open(
            `${launchConfig.path}?model=${encodeURIComponent(model.id)}`,
            "_blank",
            "noopener,noreferrer"
        );
    };

    const hasAnyModels = providerModels.length > 0;
    const hasModelTypeTabs = supportedModelTypes.length > 0;
    const providerLinkButtons = useMemo(() => {
        if (!providerUrls) return undefined;

        const buttons = PROVIDER_LINKS
            .map(({ key, icon, labelKey }) => {
                const url = providerUrls[key];
                if (!url) return null;

                const translatedLabel = t(labelKey);
                const text = key === "homepage"
                    ? providerHost || translatedLabel
                    : translatedLabel;

                return (
                    <OpenLinkButton
                        key={key}
                        url={url}
                        size="small"
                        variant="subtle"
                        icon={icon}
                        tooltip={translatedLabel}
                        text={text}
                    />
                );
            })
            .filter(Boolean);

        if (buttons.length === 0) return undefined;

        return <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{buttons}</div>;
    }, [providerHost, providerUrls, t]);

    return (
        <Modal
            show={open}
            size={size}
            onHide={onClose}
            title={providerName}
            actions={
                <div style={{ display: "flex", gap: 8 }}>
                    <Button variant="secondary" onClick={onClose}>
                        {t("close")}
                    </Button>
                </div>
            }
        >
            <Tabs activeKey={activeTab} onSelect={setActiveTab}>
                <Tab eventKey="general" title={t("general")}>
                    <div>
                        <Card image={providerImage
                            ? <Image height={40} shape="square" src={providerImage} />
                            : undefined}
                            title={providerName}
                            actions={providerLinkButtons}>
                            <div>{providerDescription}</div>
                        </Card>
                    </div>
                </Tab>

                {supportedModelTypes.map((type) => {
                    const typeModels = modelGroups.get(type) ?? [];

                    return (
                        <Tab key={type} eventKey={type} icon={getModelTypeIcon(type)}
                            title={getModelTypeLabel(type, typeModels.length)}>
                            <ProviderModelTypeContent
                                key={`${providerKey}:${type}`}
                                models={typeModels}
                                provider={provider}
                                isModelFavorite={isModelFavorite}
                                onToggleModelFavorite={onToggleModelFavorite}
                                openModelInNewWindow={openModelInNewWindow}
                                settings={providerSettingsTypes?.includes(type) ? renderProviderSettings?.(type) : undefined}
                            />
                        </Tab>
                    );
                })}

                {!hasModelTypeTabs && !hasAnyModels && (
                    <Tab eventKey="models" title={t("models")}>
                        <div style={{ paddingTop: 12 }}>
                            <Alert variant="warning">
                                {t("none")}
                            </Alert>
                        </div>
                    </Tab>
                )}
            </Tabs>
        </Modal>
    );
};

