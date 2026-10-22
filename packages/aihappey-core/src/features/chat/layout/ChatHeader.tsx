import { useEffect, useState } from "react";
import { ModelSelect } from "../../models/ModelSelect";
import { useAppStore } from "aihappey-state";
import { AgentFavoriteToggleButton, ModelFavoriteToggleButton, useTheme } from "aihappey-components";
import { UserMenuButton } from "../../user-settings/UserMenuButton";
import { useAccount } from "aihappey-auth";
import SettingsModal from "../../user-settings/SettingsModal";
import { useLocation } from "react-router";
import { useDarkMode } from "usehooks-ts";
import { AgentSelect } from "../../agents/AgentSelect";
import { normalizeSelectedAgentKeys, resolveSelectedAgentEntries } from "../../agents/agentSelection";
import { useTranslation } from "aihappey-i18n";
import { favoriteRouterModelTypes } from "../engine/favoriteRouter";

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
  const selectedChatModelIds = useAppStore((a) => a.selectedChatModelIds);
  const setSelectedChatModelIds = useAppStore((a) => a.setSelectedChatModelIds);
  const preferredDecisionModel = useAppStore((a) => a.userPreferredDecisionModel);
  const favoriteModelsByType = useAppStore((a: any) => a.favoriteModelsByType as Record<string, string[]> | undefined);
  const toggleFavoriteModelForType = useAppStore((a: any) => a.toggleFavoriteModelForType as (type: string, modelId: string) => void);
  const favoriteAgentIds = useAppStore((a: any) => a.favoriteAgentIds as string[] | undefined);
  const toggleFavoriteAgent = useAppStore((a: any) => a.toggleFavoriteAgent as (agentId: string) => void);
  const chatWithImageModels = useAppStore((a) => a.chatWithImageModels);
  const chatWithVideoModels = useAppStore((a: any) => a.chatWithVideoModels);
  const chatWithSpeechModels = useAppStore((a) => a.chatWithSpeechModels);
  const chatWithTranscriptionModels = useAppStore((a) => a.chatWithTranscriptionModels);
  const { Switch, ToggleButton, Skeleton } = useTheme();
  const account = useAccount();
  const { pathname } = useLocation();
  const hasLoadedModels = modelsLoaded && (models?.length ?? 0) > 0;
  const selectedModelOption = models?.find((m: any) => m.id === selectedModel);
  const selectedModelType = selectedModelOption?.type ?? "language";
  const isSelectedModelFavorite = !!selectedModel && (favoriteModelsByType?.[selectedModelType] ?? []).includes(selectedModel);
  const normalizedAgentValues = normalizeSelectedAgentKeys(agentValues, allAgents ?? [], remoteAgentModels ?? []);
  const selectedAgentKey = normalizedAgentValues.length === 1 ? normalizedAgentValues[0] : undefined;
  const selectedAgentEntry = selectedAgentKey
    ? resolveSelectedAgentEntries([selectedAgentKey], allAgents ?? [], remoteAgentModels ?? [])[0]
    : undefined;
  const isSelectedAgentFavorite = !!selectedAgentKey && (favoriteAgentIds ?? []).includes(selectedAgentKey);

  const modelTypes = favoriteRouterModelTypes({
    chatWithImageModels, chatWithVideoModels, chatWithSpeechModels, chatWithTranscriptionModels,
  });
  const modelValues = preferredDecisionModel && selectedChatModelIds !== undefined
    ? selectedChatModelIds : selectedModel ? [selectedModel] : [];
  const singleModelSelected = modelValues.length === 1;

  // Reconcile catalog/type changes, without treating each routing winner as a new selection.
  useEffect(() => {
    if (!preferredDecisionModel || !modelsLoaded || chatMode !== "chat") return;
    const validModels = (models ?? []).filter(model => modelTypes.includes(model.type));
    const ids = selectedChatModelIds ?? (selectedModel ? [selectedModel] : []);
    const validIds = ids.filter(id => validModels.some(model => model.id === id));
    if (validIds.length) {
      if (validIds.length !== ids.length) setSelectedChatModelIds(validIds);
      return;
    }
    const fallback = [...validModels].sort((a, b) => (b.created ?? 0) - (a.created ?? 0))[0];
    if (fallback) setSelectedModel(fallback.id);
  }, [preferredDecisionModel, modelsLoaded, models, chatMode, selectedChatModelIds, selectedModel,
    chatWithImageModels, chatWithVideoModels, chatWithSpeechModels, chatWithTranscriptionModels,
    setSelectedChatModelIds, setSelectedModel]);

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
        {chatMode == "agent" && (
          <div style={{ width: "clamp(170px, 24vw, 260px)", maxWidth: "100%", minWidth: 0 }}>
            <AgentSelect
              allowFavoriteRouter
              localAgents={allAgents ?? []}
              remoteAgentModels={remoteAgentModels ?? []}
              values={agentValues ?? []}
              onChange={onAgentChange}
              favoriteAgentIds={favoriteAgentIds ?? []}
              favoritesLabel={t("favorites")}
              style={{ width: "100%", minWidth: 0 }}
            />
          </div>
        )}
        {chatMode == "agent" && (
          <div style={{ paddingLeft: 8 }}>
            <AgentFavoriteToggleButton
              variant="subtle"
              size="small"
              isFavorite={isSelectedAgentFavorite}
              agentName={selectedAgentEntry?.label}
              onToggleFavorite={() => selectedAgentKey && toggleFavoriteAgent(selectedAgentKey)}
              disabled={!selectedAgentKey}
            />
          </div>
        )}
        {chatMode == "chat" && !modelsLoaded ? (
          <div style={{ width: "clamp(170px, 24vw, 260px)" }}>
            <Skeleton width="100%" height={32} />
          </div>
        ) : null}
        {chatMode == "chat" && hasLoadedModels ? (
          <>
            <div style={{ width: "clamp(170px, 24vw, 260px)", maxWidth: "100%", minWidth: 0 }}>
              <ModelSelect
                allowFavoriteRouter
                models={models ?? []}
                modelTypes={modelTypes}
                value={selectedModel ?? ""}
                values={modelValues}
                multiselect={!!preferredDecisionModel}
                onValuesChange={setSelectedChatModelIds}
                onChange={(id) => {
                  if (!preferredDecisionModel) return setSelectedModel(id);
                  const next = modelValues.includes(id) ? modelValues.filter(value => value !== id) : [...modelValues, id];
                  // Keep a valid selection when the last checkbox is clicked.
                  if (next.length) setSelectedChatModelIds(next);
                }}
                style={{ width: "100%", minWidth: 0 }}
              />
            </div>
            <div style={{ paddingLeft: 8 }}>
              <ModelFavoriteToggleButton
                variant="subtle"
                size="small"
                isFavorite={isSelectedModelFavorite}
                modelName={selectedModelOption?.name ?? selectedModel}
                onToggleFavorite={() => selectedModel && toggleFavoriteModelForType(selectedModelType, selectedModel)}
                disabled={!selectedModel || !singleModelSelected}
              />
            </div>
          </>
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
