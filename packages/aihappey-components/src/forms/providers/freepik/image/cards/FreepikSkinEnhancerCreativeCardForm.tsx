import React, { ChangeEvent } from "react";
import { useTheme } from "../../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import { clamp, pruneEmptyObject } from "./shared";

export type FreepikSkinEnhancerCreative = {
    sharpen?: number;
    smart_grain?: number;
};

export const FreepikSkinEnhancerCreativeCardForm: React.FC<{
    value?: FreepikSkinEnhancerCreative;
    onChange: (next: FreepikSkinEnhancerCreative | undefined) => void;
}> = ({ value, onChange }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const current = value ?? {};
    const update = (patch: Partial<FreepikSkinEnhancerCreative>) =>
        onChange(pruneEmptyObject({ ...current, ...patch }));

    return (
        <theme.Card size="small" title={t("providers:freepik.image.skinEnhancerCreative.title")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <theme.Input
                    id="freepik-skin-enhancer-creative-sharpen"
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
                    id="freepik-skin-enhancer-creative-smart-grain"
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
            </div>
        </theme.Card>
    );
};

