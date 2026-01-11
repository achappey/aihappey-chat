import React from "react";

import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

/**
 * IMPORTANT: keys must match backend JSON property names.
 * Mirrors `DeepInfraRerankingProviderMetadata`.
 */
export type DeepInfraRerankingConfig = {
    instruction?: string;
    /** Allowed values: "default" | "priority" (while `undefined` means provider default). */
    service_tier?: string;
};

export const DeepInfraRerankingConfigForm: React.FC<{
    config: DeepInfraRerankingConfig;
    updateConfig: (val: DeepInfraRerankingConfig) => void;
}> = ({ config, updateConfig }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const DEFAULT_VALUE = "__default__";

    const serviceTierOptions = [
        { value: DEFAULT_VALUE, label: t("providerDefault") },
        { value: "priority", label: t("priority") },
    ];

    const serviceTierValue = config?.service_tier ?? DEFAULT_VALUE;
    const serviceTierTitle =
        serviceTierOptions.find((o) => o.value === serviceTierValue)?.label ?? "";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <theme.Card size="small" title={t("general") ?? "General"}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.TextArea
                        label={t("instructions")}
                        placeholder={t("optional")}
                        rows={4}
                        value={config?.instruction ?? ""}
                        onChange={(val: string) => {
                            const raw = String(val ?? "");
                            updateConfig({
                                ...config,
                                instruction: raw.length ? raw : undefined,
                            });
                        }}
                    />

                    <theme.Select
                        label={t("providers:deepinfra.reranking.serviceTier")}
                        values={[serviceTierValue]}
                        valueTitle={serviceTierTitle}
                        options={serviceTierOptions}
                        onChange={(val: string) => {
                            const raw = String(val ?? "");
                            updateConfig({
                                ...config,
                                service_tier: raw === DEFAULT_VALUE ? undefined : raw,
                            });
                        }}
                        style={{ minWidth: 220 }}
                    >
                        {serviceTierOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </theme.Select>
                </div>
            </theme.Card>
        </div>
    );
};

