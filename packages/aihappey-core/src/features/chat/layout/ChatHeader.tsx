import { useState } from "react";
import { ModelSelect } from "../../models/ModelSelect";
import { useAppStore } from "aihappey-state";
import { useTheme } from "aihappey-components";
import { UserMenuButton } from "../../user-settings/UserMenuButton";
import { useAccount } from "aihappey-auth";
import SettingsModal from "../../user-settings/SettingsModal";
import { useLocation } from "react-router";
import { useDarkMode } from "usehooks-ts";
import { AgentSelect } from "../../agents/AgentSelect";

interface ChatHeaderProps {
  agentValues?: string[];
  onAgentChange: (id: string) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  agentValues, onAgentChange }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const { isDarkMode } = useDarkMode();
  const showActivities = useAppStore((a) => a.showActivities);
  const toggleActivities = useAppStore((a) => a.toggleActivities);
  const models = useAppStore((a) => a.models);
  const chatMode = useAppStore((a) => a.chatMode);
  const allAgents = useAppStore((a) => a.agents);
  const switchChatMode = useAppStore((a) => a.switchChatMode);
  const setSelectedModel = useAppStore((a) => a.setSelectedModel);
  const { Switch, ToggleButton } = useTheme();
  const account = useAccount();
  const { pathname } = useLocation();

  const toggleMode = (value: string) => {
    if (value != chatMode)
      switchChatMode();
  }

  return (
    <>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backgroundColor: isDarkMode ? "#292929" : "#ffffff",
          height: 48,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
        }}
      >
        <ToggleButton icon="brain"
          variant="subtle"
          checked={chatMode == "chat"}
          onClick={() => toggleMode("chat")} />
        <ToggleButton icon="robot"
          variant="subtle"
          checked={chatMode == "agent"}
          onClick={() => toggleMode("agent")} />
        {chatMode == "agent" && <AgentSelect
          agents={allAgents ?? []}
          values={agentValues ?? []}
          onChange={onAgentChange}
        />}
        {chatMode == "chat" && <ModelSelect
          models={models ?? []}
          value={selectedModel ?? ""}
          onChange={setSelectedModel}
        />}
        <div style={{ flex: 1 }} />
        {pathname != "" && pathname != "/" ? (
          <Switch
            onChange={toggleActivities}
            id="activities-toggle"
            checked={showActivities}
          />
        ) : null}
        <div style={{ paddingLeft: 16 }}>
          <UserMenuButton
            email={account?.username}
            onCustomize={() => console.log("Customize clicked")}
            onSettings={() => setSettingsOpen(true)}
            onLogout={() => console.log("Logout clicked")}
          />
        </div>
      </div>
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
};
