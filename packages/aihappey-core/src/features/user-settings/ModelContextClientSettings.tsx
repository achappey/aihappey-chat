import { useTheme } from "aihappey-components";
import { mcpRuntime, useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { useEffect } from "react";

export const ModelContextClientSettings = () => {
  const { Select, Slider, Switch } = useTheme();
  const { t } = useTranslation();

  const logLevel = useAppStore(s => s.logLevel);
  const setLogLevel = useAppStore(s => s.setLogLevel);

  const toolTimeout = useAppStore(s => s.toolTimeout);

  useEffect(() => {
    for (const client of mcpRuntime.values()) {
      client.setLoggingLevel(logLevel);
    }
  }, [logLevel]);

  const resetTimeoutOnProgress = useAppStore(s => s.resetTimeoutOnProgress);
  const setMcpTimeout = useAppStore(s => s.setMcpTimeout);

  const logLevelOptions = [
    "debug",
    "info",
    "notice",
    "warning",
    "error",
    "critical",
    "alert",
    "emergency",
  ].map(v => ({ value: v, label: t(`logLevels.${v}`) }));

  return (
    <>
      <Select
        values={[logLevel]}
        label={t("settingsModal.logLevel")}
        valueTitle={t(`logLevels.${logLevel}`)}
        options={logLevelOptions}
        onChange={(v: any) => setLogLevel(v)}
      >
        {logLevelOptions.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>

      <Slider
        label={t("mcpPage.toolTimeout", {
          minutes: toolTimeout / 60000,
        })}
        min={1}
        max={15}
        step={1}
        value={toolTimeout / 60000}
        onChange={v => setMcpTimeout(v * 60000, resetTimeoutOnProgress)}
      />

      <Switch
        id="reset-timeout-toggle"
        size="small"
        checked={resetTimeoutOnProgress}
        label={t("mcpPage.resetTimeoutOnProgress")}
        onChange={v => setMcpTimeout(toolTimeout, v)}
      />
    </>
  );
};