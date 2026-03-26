import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../theme/ThemeContext";

type LogLevel =
    | "debug"
    | "info"
    | "notice"
    | "warning"
    | "error"
    | "critical"
    | "alert"
    | "emergency";

type ModelContextClientSettings = {
    logLevel: LogLevel;
    toolTimeoutMinutes: number;
    resetTimeoutOnProgress: boolean;
};

type ModelContextClientSettingsFormProps = {
    value: ModelContextClientSettings;
    onChangeLogLevel: (level: LogLevel) => void;
    onChangeTimeout: (minutes: number, resetOnProgress: boolean) => void;
    onToggleResetOnProgress: (enabled: boolean) => void;
};

export const ModelContextClientSettingsForm = ({
    value,
    onChangeLogLevel,
    onChangeTimeout,
    onToggleResetOnProgress,
}: ModelContextClientSettingsFormProps) => {
    const { Select, Slider, Switch } = useTheme();
    const { t } = useTranslation();

    const logLevels: LogLevel[] = [
        "debug",
        "info",
        "notice",
        "warning",
        "error",
        "critical",
        "alert",
        "emergency",
    ];

    return (
        <>
            <Select
                values={[value.logLevel]}
                label={t("settingsModal.logLevel")}
                valueTitle={t(`logLevels.${value.logLevel}`)}
                options={logLevels.map(v => ({
                    value: v,
                    label: t(`logLevels.${v}`),
                }))}
                onChange={onChangeLogLevel}
            >
                {logLevels.map(v => (
                    <option key={v} value={v}>
                        {t(`logLevels.${v}`)}
                    </option>
                ))}
            </Select>

            <Slider
                min={1}
                max={60}
                step={1}
                value={value.toolTimeoutMinutes}
                label={t("mcpPage.toolTimeout", { minutes: value.toolTimeoutMinutes })}
                onChange={v =>
                    onChangeTimeout(v, value.resetTimeoutOnProgress)
                }
            />

            <Switch
                size="small"
                id="resetTimeoutOnProgress"
                checked={value.resetTimeoutOnProgress}
                label={t("mcpPage.resetTimeoutOnProgress")}
                onChange={onToggleResetOnProgress}
            />
        </>
    );
};
