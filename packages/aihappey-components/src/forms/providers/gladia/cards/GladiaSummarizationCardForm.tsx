import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { GladiaTranscriptionConfig } from "../GladiaTranscriptionConfigForm";

type SummarizationCardProps = {
    config: GladiaTranscriptionConfig;
    updateConfig: (val: GladiaTranscriptionConfig) => void;
};

export const GladiaSummarizationCardForm: React.FC<SummarizationCardProps> = ({
    config,
    updateConfig,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <theme.Card
            size="small"
            title={t("providers:gladia.summarization")}
            headerActions={
                <theme.Switch
                    id="gladia-summarization"
                    checked={config?.summarization ?? false}
                    onChange={(enabled) =>
                        updateConfig({
                            ...config,
                            summarization: enabled,
                            summarization_config: enabled
                                ? config?.summarization_config ?? { type: "general" }
                                : undefined,
                        })
                    }
                />
            }
        >
            {config?.summarization ? (
                <theme.Select
                    label={t("providers:gladia.summarizationType")}
                    values={[config?.summarization_config?.type ?? "general"]}
                    valueTitle={t(
                        `providers:gladia.summarizationType.${
                            config?.summarization_config?.type ?? "general"
                        }`
                    )}
                    options={[
                        {
                            value: "general",
                            label: t("providers:gladia.summarizationType.general"),
                        },
                        {
                            value: "bullet_points",
                            label: t("providers:gladia.summarizationType.bullet_points"),
                        },
                        {
                            value: "concise",
                            label: t("providers:gladia.summarizationType.concise"),
                        },
                    ]}
                    onChange={(val: string) =>
                        updateConfig({
                            ...config,
                            summarization_config: {
                                ...(config?.summarization_config ?? {}),
                                type: val as "general" | "bullet_points" | "concise",
                            },
                        })
                    }
                >
                    <option value="general">
                        {t("providers:gladia.summarizationType.general")}
                    </option>
                    <option value="bullet_points">
                        {t("providers:gladia.summarizationType.bullet_points")}
                    </option>
                    <option value="concise">
                        {t("providers:gladia.summarizationType.concise")}
                    </option>
                </theme.Select>
            ) : (
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {t("providers:gladia.summarizationHint")}
                </div>
            )}
        </theme.Card>
    );
};
