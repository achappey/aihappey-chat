import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

/** UI config bucket for transcription provider metadata: `providerMetadata.resembleai` */
export type ResembleAITranscriptionConfig = {
    /**
     * Optional "intelligence question" to evaluate after transcription.
     * Maps to Resemble Speech-to-Text API multipart field: `query`.
     */
    query?: string;
};

export const ResembleAITranscriptionConfigForm: React.FC<{
    config: ResembleAITranscriptionConfig;
    updateConfig: (val: ResembleAITranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <theme.Card size="small" title={t("general")}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.TextArea
                        label={t("providers:resembleai.queryLabel")}
                        hint={t("providers:resembleai.queryHint")}
                        placeholder={t("providers:resembleai.queryPlaceholder")}
                        rows={4}
                        value={config?.query ?? ""}
                        onChange={(value) => {
                            const next = String(value ?? "").trim();
                            updateConfig({
                                ...config,
                                query: next.length ? next : undefined,
                            });
                        }}
                    />
                </div>
            </theme.Card>
        </div>
    );
};

