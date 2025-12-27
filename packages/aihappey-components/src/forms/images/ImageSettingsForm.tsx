import React from "react";
import { useTheme } from "../../theme/ThemeContext";

import { ImageSizeSettingsForm } from "./ImageSizeSettingsForm";
import { ImageAspectRatioSettingsForm } from "./ImageAspectRatioSettingsForm";

export type ImageSettings = {
    size?: string;
    aspectRatio?: string;
    n: number;
    seed?: number;
    maxImagesPerCall?: number
};

export type ImageSettingsFormTranslations = {
    formTitle?: string;

    sizeFormTitle?: string;
    aspectFormTitle?: string;
    maxImagesPerCall?: string
    outputTitle?: string
    otherTitle?: string
    n?: string;
    seed?: string;
};

export type ImageSettingsFormProps = {
    value: ImageSettings;
    onChange: (next: ImageSettings) => void;
    translations?: ImageSettingsFormTranslations;

    sizePresets?: { w: number; h: number; label?: string }[];
    aspectPresets?: { w: number; h: number; label?: string }[];
};

const toPositiveInt = (val: any): number | undefined => {
    const n = Number(String(val ?? "").trim());
    if (!Number.isFinite(n)) return undefined;
    const i = Math.floor(n);
    return i > 0 ? i : undefined;
};

export const ImageSettingsForm: React.FC<ImageSettingsFormProps> = ({
    value,
    onChange,
    translations,
    sizePresets,
    aspectPresets,
}) => {
    const theme = useTheme();

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Size */}
            <ImageSizeSettingsForm
                value={{ size: value.size }}
                sizePresets={sizePresets}
                translations={{
                    ...translations,
                    formTitle: translations?.sizeFormTitle
                }}
                onChange={(next) =>
                    onChange({ ...value, size: next.size })
                }
            />

            <ImageAspectRatioSettingsForm
                value={{ aspectRatio: value.aspectRatio }}
                translations={{
                    ...translations,
                    formTitle: translations?.aspectFormTitle
                }}
                aspectPresets={aspectPresets}
                onChange={(next) =>
                    onChange({ ...value, aspectRatio: next.aspectRatio })
                }
            />

            {/* Output */}
            <theme.Card size="small" title={translations?.outputTitle ?? "output"}>
                <div>
                    <theme.Slider
                        label={(translations?.n ?? "n") + " (" + value.n + ")"}
                        min={1}
                        max={20}
                        value={value.n ?? 1}
                        onChange={(e: number) => {
                            onChange({ ...value, n: e });
                        }}
                    />

                    <theme.Input
                        label={translations?.maxImagesPerCall ?? "maxImagesPerCall"}
                        type="number"
                        value={String(value.maxImagesPerCall ?? "")}
                        onChange={(e: any) => {
                            const next = e.target.value ? Number(e.target.value) : undefined;
                            onChange({ ...value, maxImagesPerCall: next });
                        }}
                    />

                </div>
            </theme.Card>

            <theme.Card size="small" title={translations?.otherTitle ?? "other"}>
                <div>
                    <theme.Input
                        label={translations?.seed ?? "seed"}
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
