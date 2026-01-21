import React, { ChangeEvent } from "react";
import { useTheme } from "../../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import { clamp, pruneEmptyObject } from "./shared";

export type FreepikUpscalerPrecisionV1 = {
    sharpen?: number;
    smart_grain?: number;
    ultra_detail?: number;
};

export const FreepikUpscalerPrecisionCardForm: React.FC<{
    value?: FreepikUpscalerPrecisionV1;
    onChange: (next: FreepikUpscalerPrecisionV1 | undefined) => void;
}> = ({ value, onChange }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const current = value ?? {};
    const update = (patch: Partial<FreepikUpscalerPrecisionV1>) =>
        onChange(pruneEmptyObject({ ...current, ...patch }));

    const fields = [
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
    ] as const;

    return (
        <theme.Card size="small" title={t("providers:freepik.image.upscalerPrecision.title")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {fields.map((f) => (
                    <theme.Input
                        key={f.key}
                        id={`freepik-upscaler-precision-${f.key}`}
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
            </div>
        </theme.Card>
    );
};

