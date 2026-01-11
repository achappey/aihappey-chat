import React from "react";

import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export type RerankingSettings = {
    topN?: number;
};

export type RerankingSettingsFormProps = {
    value: RerankingSettings;
    onChange: (next: RerankingSettings) => void;
    formTitle?: string;
};

export const RerankingSettingsForm: React.FC<RerankingSettingsFormProps> = ({
    value,
    onChange,
    formTitle,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const safeValue = value;

    return (
        <theme.Card size="small" title={formTitle ?? t("general")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <theme.Input
                    type="number"
                    step={1}
                    label={t("topN")}
                    placeholder={t("optional")}
                    value={safeValue?.topN ?? ""}
                    onChange={(e: any) => {
                        const rawVal = e?.target?.value ?? "";
                        const raw = String(rawVal).trim();

                        onChange({
                            ...safeValue,
                            topN: raw === "" ? undefined
                                : Number.isFinite(Number(raw)) ? parseInt(raw, 10) : undefined,
                        });
                    }}

                />
            </div>
        </theme.Card>
    );
};

