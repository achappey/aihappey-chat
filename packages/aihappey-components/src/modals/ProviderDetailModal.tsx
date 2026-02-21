import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import type { IconToken, ModelOption, Provider, ProviderUrls } from "aihappey-types";

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

    provider?: Provider;
    size?: "small" | "medium" | "large";
};

type ProviderLinkConfig = {
    key: keyof ProviderUrls;
    icon: IconToken;
    labelKey: string;
};

const PROVIDER_LINKS: ProviderLinkConfig[] = [
    { key: "homepage", icon: "globe", labelKey: "website" },
    { key: "docs", icon: "docs", labelKey: "documentation" },
    { key: "console", icon: "console", labelKey: "console" },
    { key: "termsOfService", icon: "terms", labelKey: "terms" },
    { key: "privacyPolicy", icon: "privacy", labelKey: "privacy" },
];

const uniq = (values: string[]) => Array.from(new Set(values));

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
    provider,
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
        () => (models ?? []).filter((m) => m.id.startsWith(providerKey + "/")),
        [models, providerKey]
    );

    const supportedModelTypes = useMemo(() => {
        const discovered = providerModels.map((m) => m.type).filter(Boolean);
        const source = modelTypes?.length ? modelTypes : discovered;
        return uniq(source);
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
        const translated = t(type);
        return (translated && translated.trim().length > 0 ? translated : type)
            + ` (${count})`;
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
                        <Tab key={type} eventKey={type}
                            title={getModelTypeLabel(type, typeModels.length)}>
                            <div style={{ paddingTop: 12 }}>
                                {typeModels.length === 0 ? (
                                    <Alert variant="warning">{t("none")}</Alert>
                                ) : (
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                                            gap: 12,
                                        }}
                                    >
                                        {typeModels.map((model) => (
                                            <div key={model.id}>
                                                <ModelCard model={model} provider={provider} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
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

