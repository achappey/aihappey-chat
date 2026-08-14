import { useAppStore } from "aihappey-state";
import { ModelContextClientSettingsForm } from "aihappey-components";

export const ModelContextClientSettings = () => {
  const toolTimeout = useAppStore(s => s.toolTimeout);
  const resetTimeoutOnProgress = useAppStore(s => s.resetTimeoutOnProgress);
  const setMcpTimeout = useAppStore(s => s.setMcpTimeout);

  return (
    <ModelContextClientSettingsForm
      value={{
        toolTimeoutMinutes: toolTimeout / 60000,
        resetTimeoutOnProgress,
      }}
      onChangeTimeout={(minutes, reset) =>
        setMcpTimeout(minutes * 60000, reset)
      }
      onToggleResetOnProgress={(enabled) =>
        setMcpTimeout(toolTimeout, enabled)
      }
    />
  );
};
