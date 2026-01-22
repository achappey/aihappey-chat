import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { AssemblyAITranscriptionConfig } from "../types";

export const AssemblyAISummarizationCardForm: React.FC<{
    config: AssemblyAITranscriptionConfig;
    updateConfig: (val: AssemblyAITranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const enabled = config?.summarization ?? false;

    const modelOptions = [
        { value: "", label: t("providerDefault") },
        { value: "informative", label: "informative" },
        { value: "conversational", label: "conversational" },
        { value: "catchy", label: "catchy" },
    ];

    const typeOptions = [
        { value: "", label: t("providerDefault") },
        { value: "bullets", label: "bullets" },
        { value: "bullets_verbose", label: "bullets_verbose" },
        { value: "gist", label: "gist" },
        { value: "headline", label: "headline" },
        { value: "paragraph", label: "paragraph" },
    ];

    const setEnabled = (on: boolean) => {
        if (on) {
            updateConfig({
                ...config,
                summarization: true,
            });
            return;
        }
        updateConfig({
            ...config,
            summarization: false,
            summary_model: undefined,
            summary_type: undefined,
        });
    };

    return (
        <theme.Card
            size="small"
            title={t("providers:assemblyai.summarization")}
            headerActions={<theme.Switch id="assemblyai-summarization" checked={enabled} onChange={setEnabled} />}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <theme.Select
                    label={t("providers:assemblyai.summaryModel")}
                    disabled={!enabled}
                    values={[config?.summary_model ?? ""]}
                    valueTitle={modelOptions.find((o) => o.value === (config?.summary_model ?? ""))?.label ?? t("providerDefault")}
                    options={modelOptions}
                    onChange={(val: string) => {
                        const raw = String(val ?? "").trim();
                        updateConfig({
                            ...config,
                            summary_model: raw.length ? raw as any : undefined,
                        });
                    }}
                    style={{ minWidth: 220 }}
                >
                    {modelOptions.map((o) => (
                        <option key={o.value || "__default"} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </theme.Select>

                <theme.Select
                    label={t("providers:assemblyai.summaryType")}
                    disabled={!enabled}
                    values={[config?.summary_type ?? ""]}
                    valueTitle={typeOptions.find((o) => o.value === (config?.summary_type ?? ""))?.label ?? t("providerDefault")}
                    options={typeOptions}
                    onChange={(val: string) => {
                        const raw = String(val ?? "").trim();
                        updateConfig({
                            ...config,
                            summary_type: raw.length ? raw as any : undefined,
                        });
                    }}
                    style={{ minWidth: 220 }}
                >
                    {typeOptions.map((o) => (
                        <option key={o.value || "__default"} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </theme.Select>
            </div>
        </theme.Card>
    );
};

