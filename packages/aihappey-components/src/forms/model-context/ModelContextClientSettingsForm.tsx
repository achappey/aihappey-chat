import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../theme/ThemeContext";

type ModelContextClientSettings = {
    toolTimeoutMinutes: number;
    resetTimeoutOnProgress: boolean;
};

type ModelContextClientSettingsFormProps = {
    value: ModelContextClientSettings;
    onChangeTimeout: (minutes: number, resetOnProgress: boolean) => void;
    onToggleResetOnProgress: (enabled: boolean) => void;
};

export const ModelContextClientSettingsForm = ({
    value,
    onChangeTimeout,
    onToggleResetOnProgress,
}: ModelContextClientSettingsFormProps) => {
    const { Slider, Switch } = useTheme();
    const { t } = useTranslation();

    return (
        <>
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
