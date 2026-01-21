import React, { ChangeEvent } from "react";
import { useTranslation } from "aihappey-i18n";
import { clamp, pruneEmptyObject } from "./shared";
import { useTheme } from "../../../../../theme/ThemeContext";

export type FreepikImageExpandConfig = {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
};

export const FreepikImageExpandCardForm: React.FC<{
    value?: FreepikImageExpandConfig;
    onChange: (next: FreepikImageExpandConfig | undefined) => void;
}> = ({ value, onChange }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const current = value ?? {};

    const update = (patch: Partial<FreepikImageExpandConfig>) => {
        const next = pruneEmptyObject({ ...current, ...patch });
        onChange(next);
    };

    const onChangePx =
        (key: keyof FreepikImageExpandConfig) =>
            (e: ChangeEvent<HTMLInputElement>) => {
                const raw = String(e.target.value ?? "").trim();
                if (!raw.length) {
                    update({ [key]: undefined } as any);
                    return;
                }
                const parsed = Number(raw);
                if (!Number.isFinite(parsed)) return;
                update({ [key]: clamp(parsed, 0, 2048) } as any);
            };

    return (
        <theme.Card size="small" title={t("providers:freepik.image.imageExpand.title")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <theme.Input
                    id="freepik-image-expand-left"
                    type="number"
                    min={0}
                    max={2048}
                    step={1}
                    value={current.left}
                    label={t("providers:freepik.image.imageExpand.left")}
                    onChange={onChangePx("left")}
                />
                <theme.Input
                    id="freepik-image-expand-right"
                    type="number"
                    min={0}
                    max={2048}
                    step={1}
                    value={current.right}
                    label={t("providers:freepik.image.imageExpand.right")}
                    onChange={onChangePx("right")}
                />
                <theme.Input
                    id="freepik-image-expand-top"
                    type="number"
                    min={0}
                    max={2048}
                    step={1}
                    value={current.top}
                    label={t("providers:freepik.image.imageExpand.top")}
                    onChange={onChangePx("top")}
                />
                <theme.Input
                    id="freepik-image-expand-bottom"
                    type="number"
                    min={0}
                    max={2048}
                    step={1}
                    value={current.bottom}
                    label={t("providers:freepik.image.imageExpand.bottom")}
                    onChange={onChangePx("bottom")}
                />
            </div>
        </theme.Card>
    );
};

