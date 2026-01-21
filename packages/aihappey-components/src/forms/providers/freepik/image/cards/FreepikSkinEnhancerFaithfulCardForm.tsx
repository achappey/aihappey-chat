import React, { ChangeEvent } from "react";
import { useTheme } from "../../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import { clamp, pruneEmptyObject } from "./shared";

export type FreepikSkinEnhancerFaithful = {
    sharpen?: number;
    smart_grain?: number;
    skin_detail?: number;
};

export const FreepikSkinEnhancerFaithfulCardForm: React.FC<{
    value?: FreepikSkinEnhancerFaithful;
    onChange: (next: FreepikSkinEnhancerFaithful | undefined) => void;
}> = ({ value, onChange }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const current = value ?? {};
    const update = (patch: Partial<FreepikSkinEnhancerFaithful>) =>
        onChange(pruneEmptyObject({ ...current, ...patch }));

    return (
        <theme.Card size="small" title={t("providers:freepik.image.skinEnhancerFaithful.title")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <theme.Input
                    id="freepik-skin-enhancer-faithful-sharpen"
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
                    id="freepik-skin-enhancer-faithful-smart-grain"
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

                <theme.Input
                    id="freepik-skin-enhancer-faithful-skin-detail"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={current.skin_detail}
                    label={t("providers:freepik.image.skinEnhancerFaithful.skinDetail")}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const raw = String(e.target.value ?? "").trim();
                        update({
                            skin_detail: raw.length ? clamp(Number(raw), 0, 100) : undefined,
                        });
                    }}
                />
            </div>
        </theme.Card>
    );
};

