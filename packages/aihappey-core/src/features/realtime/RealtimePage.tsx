import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useConversations } from "aihappey-conversations";
import { useAppStore } from "aihappey-state";
import { getPrimaryAgentModel, type UIMessage } from "aihappey-types";
import { ModelFavoriteToggleButton, useTheme } from "aihappey-components";
import { useChatContext } from "../chat/context/ChatContext";
import { DisclaimerBar } from "../chat/layout/DisclaimerBar";
import { ChatErrors } from "../chat/layout/ChatErrors";
import { useChatErrors } from "../chat/layout/useChatErrors";
import { useChatFileDrop } from "../chat/input/useChatFileDrop";
import { useAttachmentParts } from "../chat/messages/useAttachmentParts";
import { useSystemMessage } from "../chat/messages/useSystemMessage";
import { useUserMessageBuilder } from "../chat/messages/useUserMessageBuilder";
import { MessageList } from "../chat/messages/MessageList";
import { WelcomeMessage } from "../chat/messages/WelcomeMessage";
import { ModelSelect } from "../models/ModelSelect";
import { UserMenuInline } from "../user-settings/UserMenuInline";
import { ElicitationModalHost } from "../elicitation/ElicitationModalHost";
import { ToolApprovalModalHost } from '../tools/ToolApprovalModalHost';
import { fileAttachmentRuntime } from "../../runtime/files/fileAttachmentRuntime";
import { urlAttachmentRuntime } from "../../runtime/files/urlAttachmentRuntime";
import { mcpResourceRuntime } from "../../runtime/mcp/mcpResourceRuntime";
import { buildSelectedAgentRequest, type AgentSelectionEntry } from "../agents/agentSelection";
import { getRealtimeAgentEntries } from "../agents/agentAudioModels";
import { AgentSelect } from "../agents/AgentSelect";
import { useAgentRealtimeConversationController } from "./useAgentRealtimeConversationController";
import { useRealtimeConversationController } from "./useRealtimeConversationController";
import { RealtimeInput } from "./RealtimeInput";
import { LocalCameraPreview } from "./LocalCameraPreview";
import { useTranslation } from "aihappey-i18n";

const addAttachmentWithTranscription = async (file: File) => {
  fileAttachmentRuntime.add(file);
};

const useRealtimeModelSelection = () => {
  const models = useAppStore((s) => s.models);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const userPreferredAudioModel = useAppStore((s: any) => s.userPreferredAudioModel);
  const realtimeModels = useMemo(
    () => (models ?? []).filter((m: any) => m?.type === "audio"
      //  || m?.tags?.includes("real-time") || m?.tags?.includes("realtime")
    ),
    [models]
  );
  const defaultModel = userPreferredAudioModel
    // ?? realtimeModels.find((m: any) => m?.tags?.includes("real-time"))?.id
    //  ?? realtimeModels[0]?.id
    // ?? (selectedModel && realtimeModels.some((m: any) => m?.id === selectedModel) ? selectedModel : undefined)
    ?? "openai/gpt-realtime-2";
  const [model, setModel] = useState(defaultModel);

  useEffect(() => {
    if (!model && defaultModel) setModel(defaultModel);
  }, [defaultModel, model]);

  return { models, model, setModel };
};

export function RealtimePage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  return conversationId ? <RealtimeConversationPage /> : <RealtimeStartPage />;
}

function RealtimeStartPage() {
  const navigate = useNavigate();
  const { create } = useConversations();
  const { addChatError } = useChatErrors();
  const { models, model, setModel } = useRealtimeModelSelection();
  const selectedModelOption = models?.find((m: any) => m.id === model);
  const cartesiaAudioOnly = model.startsWith("cartesia/agents/");
  const [creating, setCreating] = useState(false);
  const selectedAgentNames = useAppStore((s) => s.selectedAgentNames);
  const agents = useAppStore((s) => s.agents);
  const remoteAgentModels = useAppStore((s) => s.remoteAgentModels);
  const [customAgents, setCustomAgents] = useState(false);
  const [agentKey, setAgentKey] = useState("");
  const eligibleAgents = getRealtimeAgentEntries(agents, remoteAgentModels, models ?? []);
  const selectedRealtimeAgent = eligibleAgents.find(entry => entry.key === agentKey);
  const { ToggleButton, Text } = useTheme();
  const favoriteAgentIds = useAppStore(state => state.favoriteAgentIds);
  const temperature = useAppStore((s) => s.temperature);
  const setTemperature = useAppStore((s) => s.setTemperature);
  const extractExif = useAppStore((s) => s.extractExif);
  const getAttachmentParts = useAttachmentParts();
  const { buildFromText, buildFromPrompt } = useUserMessageBuilder({ getAttachmentParts, extractExif });
  const { isOver, dropRef: drop, handleDrop, handleDragOver } = useChatFileDrop(addAttachmentWithTranscription);
  const favoriteModelsByType = useAppStore((s: any) => s.favoriteModelsByType as Record<string, string[]> | undefined);
  const toggleFavoriteModelForType = useAppStore((s: any) => s.toggleFavoriteModelForType as (type: string, modelId: string) => void);
  const isFavorite = !!model && (favoriteModelsByType?.audio ?? []).includes(model);
  const { t } = useTranslation();
  const dropRef = useCallback((node: HTMLDivElement | null) => {
    if (node) drop(node);
  }, [drop]);

  const startConversation = useCallback(
    async (pendingMessage?: UIMessage) => {
      if (creating) return false;
      setCreating(true);
      try {
        if (customAgents && !selectedRealtimeAgent) throw new Error(t("agentRealtime.selectAgent"));
        const selectedAgentRequest = buildSelectedAgentRequest(selectedAgentNames, agents, remoteAgentModels);
        const conv = await create("Realtime conversation", temperature);
        await navigate(`/realtime/${conv.id}${customAgents ? `?agent=${encodeURIComponent(agentKey)}` : ""}`, {
          state: {
            model,
            pendingRealtimeMessage: pendingMessage,
            agents: selectedAgentRequest.localAgents,
            models: selectedAgentRequest.models,
          },
        });
        return true;
      } catch (e: any) {
        addChatError(e?.message ?? "Failed to start realtime conversation");
        return false;
      } finally {
        setCreating(false);
      }
    },
    [addChatError, agents, create, creating, model, navigate, remoteAgentModels, selectedAgentNames, temperature, customAgents, selectedRealtimeAgent, agentKey, t]
  );

  const handleFirstSend = useCallback(
    async (content: string) => {
      const message = await buildFromText(content);
      if (message && await startConversation(message)) {
        fileAttachmentRuntime.clear();
        mcpResourceRuntime.clear();
        urlAttachmentRuntime.clear();
      }
    },
    [buildFromText, startConversation]
  );

  return (
    <div style={{ height: "100dvh", minHeight: 0, minWidth: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "0px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <ToggleButton icon="brain" variant="subtle" title={t("aiChat")}
          checked={!customAgents} disabled={creating} onClick={() => setCustomAgents(false)} />
        <ToggleButton icon="robot" variant="subtle" title={t("aiAgents")}
          checked={customAgents} disabled={creating} onClick={() => setCustomAgents(true)} />
        {customAgents ? <>
          <div style={{ width: "clamp(170px, 24vw, 260px)", maxWidth: "100%", minWidth: 0 }}>
            <AgentSelect
              localAgents={eligibleAgents.flatMap(entry => entry.localAgent ? [entry.localAgent] : [])}
              remoteAgentModels={eligibleAgents.flatMap(entry => entry.remoteAgentModel ? [entry.remoteAgentModel] : [])}
              values={agentKey ? [agentKey] : []} onChange={setAgentKey} multiselect={false}
              favoriteAgentIds={favoriteAgentIds ?? []} favoritesLabel={t("favorites")}
              disabled={creating} style={{ width: "100%", minWidth: 0 }} />
          </div>
          {!eligibleAgents.length && <Text>{t("agentRealtime.noAgents")}</Text>}
        </> : <><ModelSelect models={models ?? []} modelTypes={["audio"]} value={model} onChange={setModel} />
        <ModelFavoriteToggleButton
          variant="subtle"
          size="small"
          isFavorite={isFavorite}
          modelName={selectedModelOption?.name ?? model}
          onToggleFavorite={() => model && toggleFavoriteModelForType("audio", model)}
          disabled={!model}
        /></>}
        <div style={{ flex: 1 }} />
        <UserMenuInline />
      </div>
      <div
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          border: isOver ? "2px dotted" : undefined,
          borderColor: isOver ? "#888" : "transparent",
          textAlign: "center",
        }}
      >
        <ChatErrors />
        <div style={{ width: "95%" }}>
          <WelcomeMessage />
          <RealtimeInput
            model={customAgents ? getPrimaryAgentModel(selectedRealtimeAgent?.localAgent ?? selectedRealtimeAgent?.remoteAgentModel?.agent)?.id ?? "" : model}
            customAgent={customAgents}
            audioOnly={!customAgents && cartesiaAudioOnly}
            temperature={temperature}
            temperatureChanged={setTemperature}
            onStart={async () => { await startConversation(); }}
            onSend={handleFirstSend}
            onPromptExecute={async (prompt, args) => {
              const message = await buildFromPrompt(prompt, args);
              if (message && await startConversation(message)) {
                fileAttachmentRuntime.clear();
                mcpResourceRuntime.clear();
                urlAttachmentRuntime.clear();
              }
            }}
            disabled={creating || (customAgents ? !selectedRealtimeAgent : !model)}
          />
        </div>
      </div>
      <DisclaimerBar />
    </div>
  );
}

function RealtimeConversationPage() {
  const location = useLocation();
  const { Spinner, Text } = useTheme();
  const { t } = useTranslation();
  const agents = useAppStore(state => state.agents);
  const remote = useAppStore(state => state.remoteAgentModels);
  const models = useAppStore(state => state.models);
  const modelsLoaded = useAppStore(state => state.modelsLoaded);
  const remoteLoaded = useAppStore(state => state.remoteAgentModelsLoaded);
  const key = new URLSearchParams(location.search).get("agent");
  if (!key) return <RealtimeConversationView key="native" />;
  if (!modelsLoaded || (key.startsWith("remote:") && !remoteLoaded)) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}><Spinner /></div>;
  const entry = getRealtimeAgentEntries(agents, remote, models ?? []).find(entry => entry.key === key);
  if (!entry) return <Text>{t("agentRealtime.unavailable")}</Text>;
  return <RealtimeConversationView key={key} agentEntry={entry} useController={useAgentRealtimeConversationController} />;
}

// Only one controller is mounted. The component key pins its hook implementation for the entire session.
function RealtimeConversationView({ agentEntry, useController = useRealtimeConversationController }: {
  agentEntry?: AgentSelectionEntry;
  useController?: (args: any) => ReturnType<typeof useRealtimeConversationController> | ReturnType<typeof useAgentRealtimeConversationController>;
}) {
  const { conversationId } = useParams<{ conversationId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { get } = useConversations();
  const { config } = useChatContext();
  const { addChatError } = useChatErrors();
  const { Spinner, JsonViewer } = useTheme();
  const selectedAgentNames = useAppStore((s) => s.selectedAgentNames);
  const setSelectedAgents = useAppStore((s) => s.setSelectedAgents);
  const debugMode = useAppStore((s) => s.debugMode);
  const temperature = useAppStore((s) => s.temperature);
  const setTemperature = useAppStore((s) => s.setTemperature);
  const extractExif = useAppStore((s) => s.extractExif);
  const { models, model, setModel } = useRealtimeModelSelection();
  const agent = agentEntry?.localAgent ?? agentEntry?.remoteAgentModel?.agent;
  const effectiveModel = agent ? getPrimaryAgentModel(agent)?.id ?? "" : String((location.state as any)?.model ?? model);
  const cartesiaAudioOnly = !agent && effectiveModel.startsWith("cartesia/agents/");
  const effectiveModelOption = models?.find((m: any) => m.id === effectiveModel);
  const favoriteModelsByType = useAppStore((s: any) => s.favoriteModelsByType as Record<string, string[]> | undefined);
  const toggleFavoriteModelForType = useAppStore((s: any) => s.toggleFavoriteModelForType as (type: string, modelId: string) => void);
  const isFavorite = !!effectiveModel && (favoriteModelsByType?.audio ?? []).includes(effectiveModel);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [started, setStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const getAttachmentParts = useAttachmentParts();
  const { buildFromText, buildFromPrompt } = useUserMessageBuilder({ getAttachmentParts, extractExif });
  const { isOver, dropRef: drop, handleDrop, handleDragOver } = useChatFileDrop(addAttachmentWithTranscription);
  const systemMessage = useSystemMessage();
  const systemInstructions = useMemo(
    () => (systemMessage.parts ?? [])
      .filter((part: any) => part?.type === "text" && typeof part?.text === "string")
      .map((part: any) => part.text)
      .join("\n\n"),
    [systemMessage]
  );
  const { t } = useTranslation();
  const dropRef = useCallback((node: HTMLDivElement | null) => {
    if (node) drop(node);
  }, [drop]);

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    void get(conversationId).then((conv) => {
      if (!cancelled) { setInitialMessages(conv?.messages ?? []); setHistoryLoaded(true); }
    }).catch(error => { if (!cancelled) addChatError(error); });
    return () => { cancelled = true; };
  }, [conversationId, get, addChatError]);

  const controller = useController({
    config,
    conversationId: conversationId!,
    initialMessages,
    model: effectiveModel,
    instructions: systemInstructions,
    audioRef,
    agent,
    agentKey: agentEntry?.key,
  });

  useEffect(() => {
    if (started || !conversationId || !historyLoaded) return;
    setStarted(true);
    const pending = (location.state as any)?.pendingRealtimeMessage as UIMessage | undefined;
    void controller.start(pending && !initialMessages.some(message => message.id === pending.id) ? pending : undefined);
  }, [controller, conversationId, location.state, started, historyLoaded, initialMessages]);

  const handleSend = useCallback(
    async (content: string) => {
      try {
        const message = await buildFromText(content);
        if (!message) return;
        await controller.sendMessage(message);
        fileAttachmentRuntime.clear();
        mcpResourceRuntime.clear();
        urlAttachmentRuntime.clear();
      } catch (e: any) {
        addChatError(e?.message ?? "Failed to send realtime message");
      }
    },
    [addChatError, buildFromText, controller]
  );

  const handleStop = useCallback(async () => {
    try {
      await controller.stop();
      await navigate(`/${conversationId}`);
    } catch (error) { addChatError(error instanceof Error ? error : new Error('Failed to save realtime conversation.')); }
  }, [addChatError, controller, conversationId, navigate]);

  const connected = controller.status === "connected";
  const busy = controller.status === "starting" || controller.status === "stopping";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        {agentEntry ? <span>{agentEntry.label}</span> : <><ModelSelect models={models ?? []} modelTypes={["audio"]} value={effectiveModel} onChange={setModel} disabled={connected || busy} />
        <ModelFavoriteToggleButton
          variant="subtle"
          size="small"
          isFavorite={isFavorite}
          modelName={effectiveModelOption?.name ?? effectiveModel}
          onToggleFavorite={() => effectiveModel && toggleFavoriteModelForType("audio", effectiveModel)}
          disabled={connected || busy || !effectiveModel}
        /></>}
        <div style={{ flex: 1 }} />
      </div>
      <audio ref={audioRef} autoPlay />
      <div
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          display: "flex",
          flexDirection: "column",
          position: "relative",
          height: "100%",
          minHeight: 0,
          border: isOver ? "2px dotted" : undefined,
          borderColor: isOver ? "#888" : "transparent",
        }}
      >
        <LocalCameraPreview stream={controller.cameraStream} />
        <ChatErrors />
        {debugMode ? <JsonViewer value={JSON.stringify(controller.events, null, 2)} /> : (
          <MessageList
            messages={controller.messages}
            streaming={"streaming" in controller ? controller.streaming : connected}
            showCitations={() => undefined}
            showAttachments={() => undefined}
            showActivity={() => undefined}
            conversationId={conversationId}
            sendMessage={async (msg: any) => handleSend(msg.prompt ?? "")}
          />
        )}
        {busy ? <div style={{ display: "flex", justifyContent: "center", padding: 16 }}><Spinner label={controller.status} /></div> : null}
        {cartesiaAudioOnly && <div style={{ padding: 8 }}>Cartesia agents accept microphone audio only. Text, files and session instructions are not supported over this connection.</div>}
        {cartesiaAudioOnly && connected && <div style={{ padding: 8, display: "flex", flexWrap: "wrap", gap: 4 }} aria-label="Cartesia DTMF keypad">
          {"123456789*0#".split("").map((digit) => <button key={digit} type="button" onClick={() => controller.sendDtmf(digit)} aria-label={`Send DTMF ${digit}`}>{digit}</button>)}
        </div>}
        <div style={{ paddingRight: 24, paddingTop: 8, boxSizing: "border-box" }}>
          <RealtimeInput
            model={effectiveModel}
            customAgent={!!agent}
            audioOnly={cartesiaAudioOnly}
            connected={connected}
            busy={busy}
            muted={controller.muted}
            cameraEnabled={controller.cameraEnabled}
            cameraSupported={controller.cameraSupported}
            onStart={() => controller.start()}
            onSend={handleSend}
            onStop={() => void handleStop()}
            onMuteChange={(muted) => controller.setMicrophoneMuted(muted)}
            onCameraChange={(enabled) => void controller.setCameraEnabled(enabled)}
            temperature={temperature}
            temperatureChanged={setTemperature}
            onPromptExecute={async (prompt, args) => {
              const message = await buildFromPrompt(prompt, args);
              if (!message) return;
              await controller.sendMessage(message);
              fileAttachmentRuntime.clear();
              mcpResourceRuntime.clear();
              urlAttachmentRuntime.clear();
            }}
            disabled={!connected && controller.status !== "idle" && controller.status !== "error"}
          />
        </div>
      </div>
      <DisclaimerBar />
      <ElicitationModalHost />
      <ToolApprovalModalHost messages={controller.approvalMessages} tools={controller.tools} status="ready" addToolApprovalResponse={controller.respondToToolApproval} />
    </div>
  );
}

