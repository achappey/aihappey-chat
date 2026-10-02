import React, { useState } from "react";
import {
    AnthropicDocumentFileConfigForm, AnthropicImageFileConfigForm,
    GoogleImageFileConfigForm, GoogleVideoFileConfigForm, MimeTypeBadge, OpenAIFileConfigForm, useTheme,
} from "aihappey-components";
import { defaultProviderFileMetadata, useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import type { IconToken } from "aihappey-types";

const forms: Record<string, Record<string, React.ComponentType<any>>> = {
    openai: { image: OpenAIFileConfigForm, default: OpenAIFileConfigForm },
    anthropic: { image: AnthropicImageFileConfigForm, document: AnthropicDocumentFileConfigForm },
    google: { image: GoogleImageFileConfigForm, video: GoogleVideoFileConfigForm },
};

export const hasProviderFileSettings = (providerKey: string) => !!forms[providerKey.toLowerCase()];

const labels: Record<string, string> = {
    image: "image", video: "video", document: "fileInput.documents", default: "fileInput.defaultFiles",
};
const icons: Record<string, IconToken> = {
    image: "image", video: "video", document: "docs", default: "attachment",
};

export const ProviderFileSettings: React.FC<{ providerKey: string }> = ({ providerKey }) => {
    const key = providerKey.toLowerCase();
    const { Tabs, Tab } = useTheme();
    const { t } = useTranslation();
    const metadata = useAppStore((state) => state.providerFileMetadata);
    const updateMetadata = useAppStore((state) => state.setProviderFileMetadata);
    const definitions = defaultProviderFileMetadata[key] ?? [];
    const [active, setActive] = useState(definitions[0]?.id ?? "");
    const iconOnly = definitions.every((entry) => !!icons[entry.id])
        && new Set(definitions.map((entry) => icons[entry.id])).size === definitions.length;

    return <Tabs vertical iconOnly={iconOnly} activeKey={active} onSelect={setActive}
        style={{ width: "100%", minWidth: 0, marginTop: 12 }}>
        {definitions.map((definition) => {
            const Form = forms[key]?.[definition.id];
            if (!Form) return null;
            const entry = metadata?.[key]?.find((item) => item.id === definition.id) ?? definition;
            const label = t(labels[definition.id] ?? "files");
            return <Tab key={definition.id} eventKey={definition.id} 
                icon={icons[definition.id] ?? "attachment"}
                title={label}>
                {active === definition.id && <div style={{ minWidth: 0 }}>
                    <div style={{ marginBottom: 12 }}>
                        <strong>{label}</strong>
                        <div style={{ marginTop: 4, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                            {definition.mediaTypes?.map((mimeType) => <MimeTypeBadge key={mimeType} mimeType={mimeType} />)
                                ?? t("fileInput.defaultFiles")}
                        </div>
                    </div>
                    <Form config={entry.config} {...(key === "openai" ? { image: definition.id === "image" } : {})}
                        updateConfig={(config: Record<string, any>) => {
                        // Functional update preserves other providers and sibling forms from the latest state.
                        updateMetadata((current) => ({
                            ...current,
                            [key]: definitions.map((target) => ({
                                ...target,
                                config: target.id === definition.id ? config
                                    : current?.[key]?.find((item) => item.id === target.id)?.config ?? target.config,
                            })),
                        }));
                    }} />
                </div>}
            </Tab>;
        })}
    </Tabs>;
};
