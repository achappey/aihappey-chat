import React from "react";
import {
    AnthropicDocumentFileConfigForm, AnthropicImageFileConfigForm,
    GoogleImageFileConfigForm, GoogleVideoFileConfigForm, MimeTypeBadge, OpenAIFileConfigForm,
    ProviderSettingsTabs, type ProviderSettingsTab,
} from "aihappey-components";
import { defaultProviderFileMetadata, useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import type { IconToken, ProviderFileMetadata } from "aihappey-types";

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

type FileSettingsState = {
    metadata: ProviderFileMetadata;
    updateMetadata: (update: (current: ProviderFileMetadata) => ProviderFileMetadata) => void;
};

/** Controlled in chat settings, live in provider details; both use identical forms. */
export const useProviderFileSettingsTabs = (providerKey: string, controlled?: FileSettingsState): ProviderSettingsTab[] => {
    const key = providerKey.toLowerCase();
    const { t } = useTranslation();
    const savedMetadata = useAppStore((state) => state.providerFileMetadata);
    const saveMetadata = useAppStore((state) => state.setProviderFileMetadata);
    const metadata = controlled?.metadata ?? savedMetadata;
    const updateMetadata = controlled?.updateMetadata ?? saveMetadata;
    const definitions = defaultProviderFileMetadata[key] ?? [];

    return definitions.flatMap((definition) => {
        const Form = forms[key]?.[definition.id];
        if (!Form) return [];
        const entry = metadata?.[key]?.find((item) => item.id === definition.id) ?? definition;
        const label = t(labels[definition.id] ?? "files");
        return [{
            id: `file:${definition.id}`, icon: icons[definition.id], title: label,
            content: <div style={{ minWidth: 0 }}>
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
                        updateMetadata((current) => {
                            const entries = current?.[key] ?? [];
                            const completeEntries = [...entries, ...definitions.filter((target) =>
                                !entries.some((item) => item.id === target.id))];
                            return { ...current, [key]: completeEntries.map((target) =>
                                target.id === definition.id ? { ...target, config } : target) };
                        });
                    }} />
            </div>,
        }];
    });
};

/** Retained for consumers that need the standalone file settings view. */
export const ProviderFileSettings: React.FC<{ providerKey: string }> = ({ providerKey }) => {
    const tabs = useProviderFileSettingsTabs(providerKey);
    return <ProviderSettingsTabs key={providerKey} tabs={tabs} />;
};
