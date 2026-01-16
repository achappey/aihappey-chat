import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { GladiaTranscriptionConfig } from "../GladiaTranscriptionConfigForm";

type DiarizationCardProps = {
    config: GladiaTranscriptionConfig;
    updateConfig: (val: GladiaTranscriptionConfig) => void;
    parseOptionalInt: (rawInput: any) => number | undefined;
};

export const GladiaDiarizationCardForm: React.FC<DiarizationCardProps> = ({
    config,
    updateConfig,
    parseOptionalInt,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <theme.Card
            size="small"
            title={t("providers:gladia.diarization")}
            headerActions={
                <theme.Switch
                    id="gladia-diarization"
                    checked={config?.diarization ?? false}
                    onChange={(enabled) =>
                        updateConfig({
                            ...config,
                            diarization: enabled,
                            diarization_config: enabled
                                ? config?.diarization_config ?? {}
                                : undefined,
                        })
                    }
                />
            }
        >
            {config?.diarization ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.Input
                        id="gladia-diarization-number"
                        label={t("providers:gladia.diarizationNumberOfSpeakers")}
                        type="number"
                        min={1}
                        step={1}
                        value={config?.diarization_config?.number_of_speakers ?? ""}
                        onChange={(e: any) =>
                            updateConfig({
                                ...config,
                                diarization_config: {
                                    ...(config?.diarization_config ?? {}),
                                    number_of_speakers: parseOptionalInt(e?.target?.value),
                                },
                            })
                        }
                    />
                    <theme.Input
                        id="gladia-diarization-min"
                        label={t("providers:gladia.diarizationMinSpeakers")}
                        type="number"
                        min={0}
                        step={1}
                        value={config?.diarization_config?.min_speakers ?? ""}
                        onChange={(e: any) =>
                            updateConfig({
                                ...config,
                                diarization_config: {
                                    ...(config?.diarization_config ?? {}),
                                    min_speakers: parseOptionalInt(e?.target?.value),
                                },
                            })
                        }
                    />
                    <theme.Input
                        id="gladia-diarization-max"
                        label={t("providers:gladia.diarizationMaxSpeakers")}
                        type="number"
                        min={0}
                        step={1}
                        value={config?.diarization_config?.max_speakers ?? ""}
                        onChange={(e: any) =>
                            updateConfig({
                                ...config,
                                diarization_config: {
                                    ...(config?.diarization_config ?? {}),
                                    max_speakers: parseOptionalInt(e?.target?.value),
                                },
                            })
                        }
                    />
                </div>
            ) : (
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {t("providers:gladia.diarizationHint")}
                </div>
            )}
        </theme.Card>
    );
};
