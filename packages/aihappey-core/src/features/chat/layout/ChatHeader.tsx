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
import { useTranslation } from "aihappey-i18n";

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
  const modelsLoaded = useAppStore((a) => a.modelsLoaded);
  const chatMode = useAppStore((a) => a.chatMode);
  const { t } = useTranslation()
  const allAgents = useAppStore((a) => a.agents);
  const remoteAgentModels = useAppStore((a) => a.remoteAgentModels);
  const switchChatMode = useAppStore((a) => a.switchChatMode);
  const setSelectedModel = useAppStore((a) => a.setSelectedModel);
  const chatWithImageModels = useAppStore((a) => a.chatWithImageModels);
  const chatWithVideoModels = useAppStore((a: any) => a.chatWithVideoModels);
  const chatWithSpeechModels = useAppStore((a) => a.chatWithSpeechModels);
  const chatWithTranscriptionModels = useAppStore((a) => a.chatWithTranscriptionModels);
  const { Switch, ToggleButton, Skeleton } = useTheme();
  const account = useAccount();
  const { pathname } = useLocation();
  const hasLoadedModels = modelsLoaded && (models?.length ?? 0) > 0;

  const modelTypes = [
    "language",
    ...(chatWithImageModels ? ["image"] as const : []),
    ...(chatWithVideoModels ? ["video"] as const : []),
    ...(chatWithSpeechModels ? ["speech"] as const : []),
    ...(chatWithTranscriptionModels ? ["transcription"] as const : []),
  ];

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
          title={t('aiChat')}
          checked={chatMode == "chat"}
          onClick={() => toggleMode("chat")} />
        <ToggleButton icon="robot"
          variant="subtle"
          title={t('aiAgents')}
          checked={chatMode == "agent"}
          onClick={() => toggleMode("agent")} />
        {chatMode == "agent" && <AgentSelect
          localAgents={allAgents ?? []}
          remoteAgentModels={remoteAgentModels ?? []}
          values={agentValues ?? []}
          onChange={onAgentChange}
        />}
        {chatMode == "chat" && !modelsLoaded ? (
          <div style={{ width: "clamp(170px, 24vw, 260px)" }}>
            <Skeleton width="100%" height={32} />
          </div>
        ) : null}
        {chatMode == "chat" && hasLoadedModels ? (
          <ModelSelect
            models={models ?? []}
            modelTypes={modelTypes}
            value={selectedModel ?? ""}
            onChange={setSelectedModel}
          />
        ) : null}
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
