import React, { ChangeEvent } from "react";
import { useTheme } from "../../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import { clamp, pruneEmptyObject } from "./shared";

export type FreepikUpscalerPrecisionV2 = {
    sharpen?: number;
    smart_grain?: number;
    ultra_detail?: number;
    flavor?: string;
    scale_factor?: number;
};

export const FreepikUpscalerPrecisionV2CardForm: React.FC<{
    value?: FreepikUpscalerPrecisionV2;
    onChange: (next: FreepikUpscalerPrecisionV2 | undefined) => void;
}> = ({ value, onChange }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const current = value ?? {};
    const update = (patch: Partial<FreepikUpscalerPrecisionV2>) =>
        onChange(pruneEmptyObject({ ...current, ...patch }));

    const flavorOptions = [
        { value: "", label: t("providerDefault") },
        { value: "sublime", label: "sublime" },
        { value: "photo", label: "photo" },
        { value: "photo_denoiser", label: "photo_denoiser" },
    ];

    const currentFlavor = current.flavor ?? "";

    return (
        <theme.Card size="small" title={t("providers:freepik.image.upscalerPrecisionV2.title")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(
                    [
                        {
                            key: "sharpen",
                            label: t("providers:freepik.image.shared.sharpen")
                        },
                        {
                            key: "smart_grain",
                            label: t("providers:freepik.image.shared.smartGrain")
                        },
                        {
                            key: "ultra_detail",
                            label: t("providers:freepik.image.shared.ultraDetail")
                        },
                    ] as const
                ).map((f) => (
                    <theme.Input
                        key={f.key}
                        id={`freepik-upscaler-precision-v2-${f.key}`}
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={(current as any)[f.key]}
                        label={f.label}

                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            const raw = String(e.target.value ?? "").trim();
                            update({
                                [f.key]: raw.length ? clamp(Number(raw), 0, 100) : undefined,
                            });
                        }}
                    />
                ))}

                <theme.Select
                    label={t("providers:freepik.image.upscalerPrecisionV2.flavor")}
                    values={[currentFlavor]}
                    valueTitle={flavorOptions.find((o) => o.value === currentFlavor)?.label}
                    options={flavorOptions}
                    onChange={(val: string) => update({ flavor: val?.trim() ? val : undefined })}
                    style={{ minWidth: 220 }}
                >
                    {flavorOptions.map((o) => (
                        <option key={o.value || "__default__"} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </theme.Select>

                <theme.Input
                    id="freepik-upscaler-precision-v2-scale-factor"
                    type="number"
                    min={2}
                    max={16}
                    step={1}
                    value={current.scale_factor}
                    label={t("providers:freepik.image.upscalerPrecisionV2.scaleFactor")}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const raw = String(e.target.value ?? "").trim();
                        update({ scale_factor: raw.length ? clamp(Number(raw), 2, 16) : undefined });
                    }}
                />
            </div>
        </theme.Card>
    );
};

