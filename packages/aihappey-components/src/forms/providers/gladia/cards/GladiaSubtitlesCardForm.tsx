import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { GladiaTranscriptionConfig } from "../GladiaTranscriptionConfigForm";

type SubtitlesCardProps = {
    config: GladiaTranscriptionConfig;
    updateConfig: (val: GladiaTranscriptionConfig) => void;
    parseOptionalNumber: (rawInput: any) => number | undefined;
    parseOptionalInt: (rawInput: any) => number | undefined;
    normalizeList: (val: unknown) => string[];
};

export const GladiaSubtitlesCardForm: React.FC<SubtitlesCardProps> = ({
    config,
    updateConfig,
    parseOptionalNumber,
    parseOptionalInt,
    normalizeList,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <theme.Card
            size="small"
            title={t("providers:gladia.subtitles")}
            headerActions={
                <theme.Switch
                    id="gladia-subtitles"
                    checked={config?.subtitles ?? false}
                    onChange={(enabled) =>
                        updateConfig({
                            ...config,
                            subtitles: enabled,
                            subtitles_config: enabled
                                ? config?.subtitles_config ?? {}
                                : undefined,
                        })
                    }
                />
            }
        >
            {config?.subtitles ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <theme.Switch
                            id="gladia-subtitles-format-srt"
                            label="SRT"
                            checked={
                                config?.subtitles_config?.formats?.includes("srt") ?? false
                            }
                            onChange={(enabled) => {
                                const current = config?.subtitles_config?.formats ?? [];
                                const next = enabled
                                    ? (normalizeList([...current, "srt"]) as Array<
                                          "srt" | "vtt"
                                      >)
                                    : (current.filter((f) => f !== "srt") as Array<
                                          "srt" | "vtt"
                                      >);
                                updateConfig({
                                    ...config,
                                    subtitles_config: {
                                        ...(config?.subtitles_config ?? {}),
                                        formats: next.length ? next : undefined,
                                    },
                                });
                            }}
                        />
                        <theme.Switch
                            id="gladia-subtitles-format-vtt"
                            label="VTT"
                            checked={
                                config?.subtitles_config?.formats?.includes("vtt") ?? false
                            }
                            onChange={(enabled) => {
                                const current = config?.subtitles_config?.formats ?? [];
                                const next = enabled
                                    ? (normalizeList([...current, "vtt"]) as Array<
                                          "srt" | "vtt"
                                      >)
                                    : (current.filter((f) => f !== "vtt") as Array<
                                          "srt" | "vtt"
                                      >);
                                updateConfig({
                                    ...config,
                                    subtitles_config: {
                                        ...(config?.subtitles_config ?? {}),
                                        formats: next.length ? next : undefined,
                                    },
                                });
                            }}
                        />
                    </div>

                    <theme.Input
                        id="gladia-subtitles-min-duration"
                        label={t("providers:gladia.subtitlesMinDuration")}
                        type="number"
                        min={0}
                        step={0.1}
                        value={config?.subtitles_config?.minimum_duration ?? ""}
                        onChange={(e: any) =>
                            updateConfig({
                                ...config,
                                subtitles_config: {
                                    ...(config?.subtitles_config ?? {}),
                                    minimum_duration: parseOptionalNumber(e?.target?.value),
                                },
                            })
                        }
                    />
                    <theme.Input
                        id="gladia-subtitles-max-duration"
                        label={t("providers:gladia.subtitlesMaxDuration")}
                        type="number"
                        min={1}
                        max={30}
                        step={0.1}
                        value={config?.subtitles_config?.maximum_duration ?? ""}
                        onChange={(e: any) =>
                            updateConfig({
                                ...config,
                                subtitles_config: {
                                    ...(config?.subtitles_config ?? {}),
                                    maximum_duration: parseOptionalNumber(e?.target?.value),
                                },
                            })
                        }
                    />
                    <theme.Input
                        id="gladia-subtitles-max-chars"
                        label={t("providers:gladia.subtitlesMaxCharsPerRow")}
                        type="number"
                        min={1}
                        step={1}
                        value={
                            config?.subtitles_config?.maximum_characters_per_row ?? ""
                        }
                        onChange={(e: any) =>
                            updateConfig({
                                ...config,
                                subtitles_config: {
                                    ...(config?.subtitles_config ?? {}),
                                    maximum_characters_per_row: parseOptionalInt(
                                        e?.target?.value
                                    ),
                                },
                            })
                        }
                    />
                    <theme.Input
                        id="gladia-subtitles-max-rows"
                        label={t("providers:gladia.subtitlesMaxRowsPerCaption")}
                        type="number"
                        min={1}
                        max={5}
                        step={1}
                        value={config?.subtitles_config?.maximum_rows_per_caption ?? ""}
                        onChange={(e: any) =>
                            updateConfig({
                                ...config,
                                subtitles_config: {
                                    ...(config?.subtitles_config ?? {}),
                                    maximum_rows_per_caption: parseOptionalInt(
                                        e?.target?.value
                                    ),
                                },
                            })
                        }
                    />
                    <theme.Select
                        label={t("providers:gladia.subtitlesStyle")}
                        values={[config?.subtitles_config?.style ?? "default"]}
                        valueTitle={t(
                            `providers:gladia.subtitlesStyle.${
                                config?.subtitles_config?.style ?? "default"
                            }`
                        )}
                        options={[
                            {
                                value: "default",
                                label: t("providers:gladia.subtitlesStyle.default"),
                            },
                            {
                                value: "compliance",
                                label: t("providers:gladia.subtitlesStyle.compliance"),
                            },
                        ]}
                        onChange={(val: string) =>
                            updateConfig({
                                ...config,
                                subtitles_config: {
                                    ...(config?.subtitles_config ?? {}),
                                    style: val as "default" | "compliance",
                                },
                            })
                        }
                    >
                        <option value="default">
                            {t("providers:gladia.subtitlesStyle.default")}
                        </option>
                        <option value="compliance">
                            {t("providers:gladia.subtitlesStyle.compliance")}
                        </option>
                    </theme.Select>
                </div>
            ) : (
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {t("providers:gladia.subtitlesHint")}
                </div>
            )}
        </theme.Card>
    );
};
