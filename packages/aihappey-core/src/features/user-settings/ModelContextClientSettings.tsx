import { useEffect } from "react";
import { mcpRuntime, useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { ModelContextClientSettingsForm } from "aihappey-components";

export const ModelContextClientSettings = () => {
  const logLevel = useAppStore(s => s.logLevel);
  const setLogLevel = useAppStore(s => s.setLogLevel);

  const toolTimeout = useAppStore(s => s.toolTimeout);
  const resetTimeoutOnProgress = useAppStore(s => s.resetTimeoutOnProgress);
  const setMcpTimeout = useAppStore(s => s.setMcpTimeout);

  useEffect(() => {
    for (const client of mcpRuntime.values()) {
      client.setLoggingLevel(logLevel);
    }
  }, [logLevel]);

  return (
    <ModelContextClientSettingsForm
      value={{
        logLevel,
        toolTimeoutMinutes: toolTimeout / 60000,
        resetTimeoutOnProgress,
      }}
      onChangeLogLevel={setLogLevel}
      onChangeTimeout={(minutes, reset) =>
        setMcpTimeout(minutes * 60000, reset)
      }
      onToggleResetOnProgress={(enabled) =>
        setMcpTimeout(toolTimeout, enabled)
      }
    />
  );
};
