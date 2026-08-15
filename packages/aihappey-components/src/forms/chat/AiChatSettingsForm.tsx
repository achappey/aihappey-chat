import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "aihappey-i18n";
import { TemperatureField } from "../../fields";
import { useTheme } from "../../theme/ThemeContext";

type AiChatSettings = {

    maxOutputTokens?: number
};

type StructuredOutputOption = {
    key: string
    label: string
};

type AiChatSettingsFormProps = {
    value: AiChatSettings
    onChange: (settings: AiChatSettings) => void
    formTitle?: string
    structuredOutputOptions?: StructuredOutputOption[]
    structuredOutputValueTitle?: string
    structuredOutputValue?: string
    onStructuredOutputChange?: (value: string) => void
    verbosity?: "low" | "medium" | "high"
    onVerbosityChange?: (value: "low" | "medium" | "high") => void
};

export const AiChatSettingsForm = memo(({
    value,
    onChange,
    formTitle,
    structuredOutputOptions,
    structuredOutputValueTitle,
    structuredOutputValue,
    onStructuredOutputChange,
    verbosity = "medium",
    onVerbosityChange,
}: AiChatSettingsFormProps) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const SelectComponent = theme.Select || "select";

    const safeValue = value;

    const handleMaxTokensChange = useCallback(
        (e: any) => {
            const raw = String(e?.target?.value ?? "");
            const parsed = raw.trim() ? parseInt(raw, 10) : NaN;
            const maxOutputTokens = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
            onChange({
                ...safeValue,
                maxOutputTokens,
            });
        },
        [onChange, safeValue]
    );

    const handleStructuredOutputChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement> | any) => {
            const selectedValue = e?.target?.value ?? e?.currentTarget?.value ?? e;
            onStructuredOutputChange?.(selectedValue ?? "");
        },
        [onStructuredOutputChange]
    );

    const handleVerbosityChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement> | any) => {
            const selectedValue = e?.target?.value ?? e?.currentTarget?.value ?? e;
            if (selectedValue === "low" || selectedValue === "medium" || selectedValue === "high") {
                onVerbosityChange?.(selectedValue);
            }
        },
        [onVerbosityChange]
    );

    const structuredOutputOptionsMarkup = useMemo(
        () =>
            structuredOutputOptions?.map((item) => (
                <option key={item.key} value={item.key}>
                    {item.label}
                </option>
            )),
        [structuredOutputOptions]
    );

    return (
        <>
            <theme.Card size="small" title={formTitle}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>

                    <theme.Input
                        type="number"
                        min={1}
                        step={1}
                        label={t("maxOutputTokens") ?? "maxOutputTokens"}
                        placeholder={t("optional") ?? "optional"}
                        value={safeValue?.maxOutputTokens ?? ""}
                        onChange={handleMaxTokensChange}
                    />

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {structuredOutputOptions && onStructuredOutputChange && (
                            <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                                <SelectComponent
                                    values={[structuredOutputValue || ""]}
                                    label={t("structuredOutputs")}
                                    options={structuredOutputOptions}
                                    valueTitle={structuredOutputValueTitle ?? t("providerDefault")}
                                    onChange={handleStructuredOutputChange}
                                    aria-label={t("structuredOutputs")}
                                >
                                    <option value="">{t("providerDefault")}</option>
                                    {structuredOutputOptionsMarkup}
                                </SelectComponent>
                            </div>
                        )}
                        {onVerbosityChange && (
                            <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                                <SelectComponent
                                    values={[verbosity]}
                                    label={t("verbosity")}
                                    valueTitle={t(`verbosityValues.${verbosity}`)}
                                    onChange={handleVerbosityChange}
                                    aria-label={t("verbosity")}
                                >
                                    <option value="low">{t("verbosityValues.low")}</option>
                                    <option value="medium">{t("verbosityValues.medium")}</option>
                                    <option value="high">{t("verbosityValues.high")}</option>
                                </SelectComponent>
                            </div>
                        )}
                    </div>

                </div>
            </theme.Card>


        </>
    );
});
