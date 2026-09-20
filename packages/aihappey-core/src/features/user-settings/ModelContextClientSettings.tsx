import { useAppStore } from "aihappey-state";
import { ModelContextClientSettingsForm } from "aihappey-components";

export const ModelContextClientSettings = () => {
  const toolTimeout = useAppStore(s => s.toolTimeout);
  const resetTimeoutOnProgress = useAppStore(s => s.resetTimeoutOnProgress);
  const enableMcpElicitation = useAppStore(s => s.enableMcpElicitation);
  const mcpServerContent = useAppStore(s => s.mcpServerContent);
  const setMcpTimeout = useAppStore(s => s.setMcpTimeout);
  const setMcpElicitationEnabled = useAppStore(s => s.setMcpElicitationEnabled);
  const hasConnectedMcpServers = Object.keys(mcpServerContent).length > 0;

  return (
    <ModelContextClientSettingsForm
      value={{
        toolTimeoutMinutes: toolTimeout / 60000,
        resetTimeoutOnProgress,
        enableElicitation: enableMcpElicitation !== false,
      }}
      elicitationDisabled={hasConnectedMcpServers}
      onChangeTimeout={(minutes, reset) =>
        setMcpTimeout(minutes * 60000, reset)
      }
      onToggleResetOnProgress={(enabled) =>
        setMcpTimeout(toolTimeout, enabled)
      }
      onToggleElicitation={setMcpElicitationEnabled}
    />
  );
};
