import React, { ChangeEvent } from "react";
import { useTheme } from "../../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import { clamp, pruneEmptyObject } from "./shared";

export type FreepikUpscalerCreative = {
    scale_factor?: string;
    optimized_for?: string;
    creativity?: number;
    hdr?: number;
    resemblance?: number;
    fractality?: number;
    engine?: string;
};

export const FreepikUpscalerCreativeCardForm: React.FC<{
    value?: FreepikUpscalerCreative;
    onChange: (next: FreepikUpscalerCreative | undefined) => void;
}> = ({ value, onChange }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const current = value ?? {};
    const update = (patch: Partial<FreepikUpscalerCreative>) =>
        onChange(pruneEmptyObject({ ...current, ...patch }));

    const scaleFactorOptions = ["", "2x", "4x", "8x", "16x"];
    const optimizedForOptions = [
        "",
        "standard",
        "soft_portraits",
        "hard_portraits",
        "art_n_illustration",
        "videogame_assets",
        "nature_n_landscapes",
        "films_n_photography",
        "3d_renders",
        "science_fiction_n_horror",
    ];
    const engineOptions = [
        "",
        "automatic",
        "magnific_illusio",
        "magnific_sharpy",
        "magnific_sparkle",
    ];

    return (
        <theme.Card size="small" title={t("providers:freepik.image.upscalerCreative.title")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <theme.Select
                    label={t("providers:freepik.image.upscalerCreative.scaleFactor")}
                    values={[current.scale_factor ?? ""]}
                    valueTitle={current.scale_factor || t("providerDefault")}
                    options={[]}
                    onChange={(val: string) =>
                        update({ scale_factor: val?.trim() ? val : undefined })
                    }
                    style={{ minWidth: 220 }}
                >
                    {scaleFactorOptions.map((v) => (
                        <option key={v || "__default__"} value={v}>
                            {v || t("providerDefault")}
                        </option>
                    ))}
                </theme.Select>

                <theme.Select
                    label={t("providers:freepik.image.upscalerCreative.optimizedFor")}
                    values={[current.optimized_for ?? ""]}
                    valueTitle={current.optimized_for || t("providerDefault")}
                    options={[]}
                    onChange={(val: string) =>
                        update({ optimized_for: val?.trim() ? val : undefined })
                    }
                    style={{ minWidth: 220 }}
                >
                    {optimizedForOptions.map((v) => (
                        <option key={v || "__default__"} value={v}>
                            {v || t("providerDefault")}
                        </option>
                    ))}
                </theme.Select>

                {(
                    [
                        {
                            key: "creativity",
                            label: t("providers:freepik.image.upscalerCreative.creativity")
                        },
                        {
                            key: "hdr",
                            label: t("providers:freepik.image.upscalerCreative.hdr")
                        },
                        {
                            key: "resemblance",
                            label: t("providers:freepik.image.upscalerCreative.resemblance")
                        },
                        {
                            key: "fractality",
                            label: t("providers:freepik.image.upscalerCreative.fractality")
                        },
                    ] as const
                ).map((f) => (
                    <theme.Input
                        key={f.key}
                        id={`freepik-upscaler-creative-${f.key}`}
                        type="number"
                        min={-10}
                        max={10}
                        step={1}
                        value={(current as any)[f.key]}
                        label={f.label}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            const raw = String(e.target.value ?? "").trim();
                            update({
                                [f.key]: raw.length ? clamp(Number(raw), -10, 10) : undefined,
                            });
                        }}
                    />
                ))}

                <theme.Select
                    label={t("providers:freepik.image.upscalerCreative.engine")}
                    values={[current.engine ?? ""]}
                    valueTitle={current.engine || t("providerDefault")}
                    options={[]}
                    onChange={(val: string) => update({ engine: val?.trim() ? val : undefined })}
                    style={{ minWidth: 220 }}
                >
                    {engineOptions.map((v) => (
                        <option key={v || "__default__"} value={v}>
                            {v || t("providerDefault")}
                        </option>
                    ))}
                </theme.Select>
            </div>
        </theme.Card>
    );
};

