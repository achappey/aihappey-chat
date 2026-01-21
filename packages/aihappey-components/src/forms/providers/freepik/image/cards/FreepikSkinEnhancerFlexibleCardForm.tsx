import React, { ChangeEvent } from "react";
import { useTheme } from "../../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import { clamp, pruneEmptyObject } from "./shared";

export type FreepikSkinEnhancerFlexible = {
    sharpen?: number;
    smart_grain?: number;
    optimized_for?: string;
};

export const FreepikSkinEnhancerFlexibleCardForm: React.FC<{
    value?: FreepikSkinEnhancerFlexible;
    onChange: (next: FreepikSkinEnhancerFlexible | undefined) => void;
}> = ({ value, onChange }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const current = value ?? {};
    const update = (patch: Partial<FreepikSkinEnhancerFlexible>) =>
        onChange(pruneEmptyObject({ ...current, ...patch }));

    const optimizedForOptions = [
        { value: "", label: t("providerDefault") },
        { value: "enhance_skin", label: "enhance_skin" },
        { value: "improve_lighting", label: "improve_lighting" },
        { value: "enhance_everything", label: "enhance_everything" },
        { value: "transform_to_real", label: "transform_to_real" },
        { value: "no_make_up", label: "no_make_up" },
    ];

    const currentOptimizedFor = current.optimized_for ?? "";

    return (
        <theme.Card size="small" title={t("providers:freepik.image.skinEnhancerFlexible.title")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <theme.Input
                    id="freepik-skin-enhancer-flexible-sharpen"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={current.sharpen}
                    label={t("providers:freepik.image.shared.sharpen")}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const raw = String(e.target.value ?? "").trim();
                        update({ sharpen: raw.length ? clamp(Number(raw), 0, 100) : undefined });
                    }}
                />

                <theme.Input
                    id="freepik-skin-enhancer-flexible-smart-grain"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={current.smart_grain}
                    label={t("providers:freepik.image.shared.smartGrain")}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const raw = String(e.target.value ?? "").trim();
                        update({
                            smart_grain: raw.length ? clamp(Number(raw), 0, 100) : undefined,
                        });
                    }}
                />

                <theme.Select
                    label={t("providers:freepik.image.skinEnhancerFlexible.optimizedFor")}
                    values={[currentOptimizedFor]}
                    valueTitle={
                        optimizedForOptions.find((o) => o.value === currentOptimizedFor)?.label
                    }
                    options={optimizedForOptions}
                    onChange={(val: string) =>
                        update({ optimized_for: val?.trim() ? val : undefined })
                    }
                    style={{ minWidth: 220 }}
                >
                    {optimizedForOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </theme.Select>
            </div>
        </theme.Card>
    );
};

