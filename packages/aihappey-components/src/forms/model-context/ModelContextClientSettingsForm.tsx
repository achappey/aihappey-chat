import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../theme/ThemeContext";

type ModelContextClientSettings = {
    toolTimeoutMinutes: number;
    resetTimeoutOnProgress: boolean;
    enableElicitation: boolean;
};

type ModelContextClientSettingsFormProps = {
    value: ModelContextClientSettings;
    elicitationDisabled?: boolean;
    onChangeTimeout: (minutes: number, resetOnProgress: boolean) => void;
    onToggleResetOnProgress: (enabled: boolean) => void;
    onToggleElicitation: (enabled: boolean) => void;
};

export const ModelContextClientSettingsForm = ({
    value,
    elicitationDisabled = false,
    onChangeTimeout,
    onToggleResetOnProgress,
    onToggleElicitation,
}: ModelContextClientSettingsFormProps) => {
    const { Card, Slider, Switch } = useTheme();
    const { t } = useTranslation();

    return (
        <>
            <Card size="small" title={t("elicit")}>
                <div style={{ display: "grid", gap: 12 }}>
            <Switch
                size="small"
                id="enableMcpElicitation"
                checked={value.enableElicitation}
                disabled={elicitationDisabled}
                label={t("agents.elicitationForm")}
                hint={elicitationDisabled ? t("settingsModal.elicitationConnectedHint") : undefined}
                onChange={onToggleElicitation}
            />
                    <Switch
                        size="small"
                        id="enableMcpUrlElicitation"
                        checked={false}
                        disabled
                        label={t("agents.elicitationUrl")}
                        hint={t("settingsModal.elicitationUrlUnavailable")}
                        onChange={() => {}}
                    />
                </div>
            </Card>
            <Card size="small" title={t("tools")}>
                <div style={{ display: "grid", gap: 12 }}>
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
                </div>
            </Card>
        </>
    );
};
