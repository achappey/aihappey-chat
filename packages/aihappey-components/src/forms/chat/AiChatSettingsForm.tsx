import { useTranslation } from "aihappey-i18n";
import { TemperatureField } from "../../fields";
import { useTheme } from "../../theme/ThemeContext";

type AiChatSettings = {
    temperature: number

    maxOutputTokens?: number
};

type AiChatSettingsFormProps = {
    value: AiChatSettings
    onChange: (settings: AiChatSettings) => void
    formTitle?: string
};

export const AiChatSettingsForm = ({
    value,
    onChange,
    formTitle,
}: AiChatSettingsFormProps) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const safeValue = value;

    return (
        <theme.Card size="small" title={formTitle}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <TemperatureField
                    value={safeValue?.temperature}
                    onChange={(temperature) =>
                        onChange({
                            ...safeValue,
                            temperature,
                        })
                    }
                />

                <theme.Input
                    type="number"
                    min={1}
                    step={1}
                    label={t("maxOutputTokens") ?? "maxOutputTokens"}
                    placeholder={t("optional") ?? "optional"}
                    value={safeValue?.maxOutputTokens ?? ""}
                    onChange={(e: any) => {
                        const raw = String(e?.target?.value ?? "");
                        const parsed = raw.trim() ? parseInt(raw, 10) : NaN;
                        const maxOutputTokens = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
                        onChange({
                            ...safeValue,
                            maxOutputTokens,
                        });
                    }}
                />
            </div>
        </theme.Card>
    );
};
