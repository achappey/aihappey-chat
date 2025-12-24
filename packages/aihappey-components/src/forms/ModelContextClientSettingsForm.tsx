import { useTheme } from "../theme/ThemeContext";

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
    translations?: {
        logLevelLabel?: string;
        logLevelTitles?: Record<LogLevel, string>;
        timeoutLabel?: (minutes: number) => string;
        resetTimeoutLabel?: string;
    };
};

export const ModelContextClientSettingsForm = ({
    value,
    onChangeLogLevel,
    onChangeTimeout,
    onToggleResetOnProgress,
    translations,
}: ModelContextClientSettingsFormProps) => {
    const { Select, Slider, Switch } = useTheme();

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
                label={translations?.logLevelLabel ?? "logLevel"}
                valueTitle={translations?.logLevelTitles?.[value.logLevel]}
                options={logLevels.map(v => ({
                    value: v,
                    label: translations?.logLevelTitles?.[v] ?? v,
                }))}
                onChange={onChangeLogLevel}
            >
                {logLevels.map(v => (
                    <option key={v} value={v}>
                        {translations?.logLevelTitles?.[v] ?? v}
                    </option>
                ))}
            </Select>

            <Slider
                min={1}
                max={15}
                step={1}
                value={value.toolTimeoutMinutes}
                label={translations?.timeoutLabel ?
                    translations?.timeoutLabel?.(value.toolTimeoutMinutes) : "toolTimeout"}
                onChange={v =>
                    onChangeTimeout(v, value.resetTimeoutOnProgress)
                }
            />

            <Switch
                size="small"
                id="resetTimeoutOnProgress"
                checked={value.resetTimeoutOnProgress}
                label={translations?.resetTimeoutLabel ?? "resetTimeout"}
                onChange={onToggleResetOnProgress}
            />
        </>
    );
};
