import React from "react";
import { useTheme } from "../../theme/ThemeContext";

import { ImageSizeSettingsForm } from "./ImageSizeSettingsForm";
import { ImageAspectRatioSettingsForm } from "./ImageAspectRatioSettingsForm";
import { useTranslation } from "aihappey-i18n";

export type ImageSettings = {
    size?: string;
    aspectRatio?: string;
    n: number;
    seed?: number;
    maxImagesPerCall?: number
};

export type ImageSettingsFormProps = {
    value: ImageSettings;
    onChange: (next: ImageSettings) => void;
    sizePresets?: { w: number; h: number; label?: string }[];
    aspectPresets?: { w: number; h: number; label?: string }[];
};

export const ImageSettingsForm: React.FC<ImageSettingsFormProps> = ({
    value,
    onChange,
    sizePresets,
    aspectPresets,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Size */}
            <ImageSizeSettingsForm
                value={{ size: value.size }}
                sizePresets={sizePresets}
                onChange={(next) =>
                    onChange({ ...value, size: next.size })
                }
            />

            <ImageAspectRatioSettingsForm
                value={{ aspectRatio: value.aspectRatio }}
                aspectPresets={aspectPresets}
                onChange={(next) =>
                    onChange({ ...value, aspectRatio: next.aspectRatio })
                }
            />

            {/* Output */}
            <theme.Card size="small" title={t("imageSettings.output")}>
                <div>
                    <theme.Slider
                        label={t("imageSettings.n", { n: value.n })}
                        min={1}
                        max={20}
                        value={value.n ?? 1}
                        onChange={(e: number) => {
                            onChange({ ...value, n: e });
                        }}
                    />

                    <theme.Input
                        label={t("imageSettings.maxImagesPerCall")}
                        type="number"
                        value={String(value.maxImagesPerCall ?? "")}
                        onChange={(e: any) => {
                            const next = e.target.value ? Number(e.target.value) : undefined;
                            onChange({ ...value, maxImagesPerCall: next });
                        }}
                    />

                </div>
            </theme.Card>

            <theme.Card size="small"
                title={t("imageSettings.other")}>
                <div>
                    <theme.Input
                        label={t("imageSettings.seed")}
                        type="number"
                        value={value.seed === undefined ? "" : String(value.seed)}
                        onChange={(e: any) => {
                            const raw = String(e.target.value ?? "").trim();
                            if (!raw) {
                                onChange({ ...value, seed: undefined });
                                return;
                            }
                            const parsed = Number(raw);
                            onChange({
                                ...value,
                                seed: Number.isFinite(parsed) ? parsed : undefined,
                            });
                        }}
                    />
                </div>
            </theme.Card>
        </div>
    );
};
