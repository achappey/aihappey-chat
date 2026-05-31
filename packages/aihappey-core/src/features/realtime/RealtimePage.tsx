import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useConversations } from "aihappey-conversations";
import { useAppStore } from "aihappey-state";
import type { UIMessage } from "aihappey-types";
import { useTheme } from "aihappey-components";
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
import { fileAttachmentRuntime } from "../../runtime/files/fileAttachmentRuntime";
import { mcpResourceRuntime } from "../../runtime/mcp/mcpResourceRuntime";
import { buildSelectedAgentRequest } from "../agents/agentSelection";
import { useRealtimeConversationController } from "./useRealtimeConversationController";
import { RealtimeInput } from "./RealtimeInput";
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
  const [creating, setCreating] = useState(false);
  const selectedAgentNames = useAppStore((s) => s.selectedAgentNames);
  const agents = useAppStore((s) => s.agents);
  const remoteAgentModels = useAppStore((s) => s.remoteAgentModels);
  const temperature = useAppStore((s) => s.temperature);
  const setTemperature = useAppStore((s) => s.setTemperature);
  const extractExif = useAppStore((s) => s.extractExif);
  const getAttachmentParts = useAttachmentParts();
  const { buildFromText, buildFromPrompt } = useUserMessageBuilder({ getAttachmentParts, extractExif });
  const { isOver, dropRef: drop, handleDrop, handleDragOver } = useChatFileDrop(addAttachmentWithTranscription);
  const { Button } = useTheme();
  const favoriteModelsByType = useAppStore((s: any) => s.favoriteModelsByType as Record<string, string[]> | undefined);
  const toggleFavoriteModelForType = useAppStore((s: any) => s.toggleFavoriteModelForType as (type: string, modelId: string) => void);
  const isFavorite = !!model && (favoriteModelsByType?.audio ?? []).includes(model);
  const { t } = useTranslation();
  const dropRef = useCallback((node: HTMLDivElement | null) => {
    if (node) drop(node);
  }, [drop]);

  const startConversation = useCallback(
    async (pendingMessage?: UIMessage) => {
      if (creating) return;
      setCreating(true);
      try {
        const selectedAgentRequest = buildSelectedAgentRequest(selectedAgentNames, agents, remoteAgentModels);
        const conv = await create("Realtime conversation", temperature);
        await navigate(`/realtime/${conv.id}`, {
          state: {
            model,
            pendingRealtimeMessage: pendingMessage,
            agents: selectedAgentRequest.localAgents,
            models: selectedAgentRequest.models,
          },
        });
      } catch (e: any) {
        addChatError(e?.message ?? "Failed to start realtime conversation");
      } finally {
        setCreating(false);
      }
    },
    [addChatError, agents, create, creating, model, navigate, remoteAgentModels, selectedAgentNames, temperature]
  );

  const handleFirstSend = useCallback(
    async (content: string) => {
      const message = await buildFromText(content);
      await startConversation(message);
      fileAttachmentRuntime.clear();
      mcpResourceRuntime.clear();
    },
    [buildFromText, startConversation]
  );

  return (
    <div style={{ height: "100dvh", minHeight: 0, minWidth: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "0px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <ModelSelect models={models ?? []} modelTypes={["audio"]} value={model} onChange={setModel} />
        <Button
          variant="subtle"
          size="small"
          icon={isFavorite ? "starFilled" : "star"}
          onClick={() => model && toggleFavoriteModelForType("audio", model)}
          disabled={!model}
          title={isFavorite ? t("unfavorite_model") : t("favorite_model")}
        />
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
            temperature={temperature}
            temperatureChanged={setTemperature}
            onStart={() => startConversation()}
            onSend={handleFirstSend}
            onPromptExecute={async (prompt, args) => {
              const message = await buildFromPrompt(prompt, args);
              await startConversation(message);
              fileAttachmentRuntime.clear();
              mcpResourceRuntime.clear();
            }}
            disabled={creating || !model}
          />
        </div>
      </div>
      <DisclaimerBar />
    </div>
  );
}

function RealtimeConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { get, items } = useConversations();
  const { config } = useChatContext();
  const { addChatError } = useChatErrors();
  const { Spinner, JsonViewer, Button } = useTheme();
  const selectedAgentNames = useAppStore((s) => s.selectedAgentNames);
  const setSelectedAgents = useAppStore((s) => s.setSelectedAgents);
  const debugMode = useAppStore((s) => s.debugMode);
  const temperature = useAppStore((s) => s.temperature);
  const setTemperature = useAppStore((s) => s.setTemperature);
  const extractExif = useAppStore((s) => s.extractExif);
  const { models, model, setModel } = useRealtimeModelSelection();
  const effectiveModel = String((location.state as any)?.model ?? model);
  const favoriteModelsByType = useAppStore((s: any) => s.favoriteModelsByType as Record<string, string[]> | undefined);
  const toggleFavoriteModelForType = useAppStore((s: any) => s.toggleFavoriteModelForType as (type: string, modelId: string) => void);
  const isFavorite = !!effectiveModel && (favoriteModelsByType?.audio ?? []).includes(effectiveModel);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>(items.find((c) => c.id === conversationId)?.messages ?? []);
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
    void get(conversationId).then((conv) => setInitialMessages(conv?.messages ?? []));
  }, [conversationId, get]);

  const controller = useRealtimeConversationController({
    config,
    conversationId: conversationId!,
    initialMessages,
    model: effectiveModel,
    instructions: systemInstructions,
    audioRef,
  });

  useEffect(() => {
    if (started || !conversationId) return;
    setStarted(true);
    const pending = (location.state as any)?.pendingRealtimeMessage as UIMessage | undefined;
    void controller.start(pending);
  }, [controller, conversationId, location.state, started]);

  const handleSend = useCallback(
    async (content: string) => {
      try {
        const message = await buildFromText(content);
        if (!message) return;
        await controller.sendMessage(message);
        fileAttachmentRuntime.clear();
        mcpResourceRuntime.clear();
      } catch (e: any) {
        addChatError(e?.message ?? "Failed to send realtime message");
      }
    },
    [addChatError, buildFromText, controller]
  );

  const handleStop = useCallback(async () => {
    await controller.stop();
    navigate(`/${conversationId}`);
  }, [controller, conversationId, navigate]);

  const connected = controller.status === "connected";
  const busy = controller.status === "starting" || controller.status === "stopping";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <ModelSelect models={models ?? []} modelTypes={["audio"]} value={effectiveModel} onChange={setModel} disabled={connected || busy} />
        <Button
          variant="subtle"
          size="small"
          icon={isFavorite ? "starFilled" : "star"}
          onClick={() => effectiveModel && toggleFavoriteModelForType("audio", effectiveModel)}
          disabled={connected || busy || !effectiveModel}
          title={isFavorite ? t("unfavorite_model") : t("favorite_model")}
        />
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
          height: "100%",
          minHeight: 0,
          border: isOver ? "2px dotted" : undefined,
          borderColor: isOver ? "#888" : "transparent",
        }}
      >
        <ChatErrors />
        {debugMode ? <JsonViewer value={JSON.stringify(controller.events, null, 2)} /> : (
          <MessageList
            messages={controller.messages}
            streaming={connected}
            showCitations={() => undefined}
            showAttachments={() => undefined}
            showActivity={() => undefined}
            conversationId={conversationId}
            sendMessage={async (msg: any) => handleSend(msg.prompt ?? "")}
          />
        )}
        {busy ? <Spinner label={controller.status} /> : null}
        <div style={{ paddingRight: 24, paddingTop: 8, boxSizing: "border-box" }}>
          <RealtimeInput
            connected={connected}
            busy={busy}
            muted={controller.muted}
            onStart={() => controller.start()}
            onSend={handleSend}
            onStop={() => void handleStop()}
            onMuteChange={(muted) => controller.setMicrophoneMuted(muted)}
            temperature={temperature}
            temperatureChanged={setTemperature}
            onPromptExecute={async (prompt, args) => {
              const message = await buildFromPrompt(prompt, args);
              if (message) await controller.sendMessage(message);
              fileAttachmentRuntime.clear();
              mcpResourceRuntime.clear();
            }}
            disabled={!connected && controller.status !== "idle" && controller.status !== "error"}
          />
        </div>
      </div>
      <DisclaimerBar />
      <ElicitationModalHost />
    </div>
  );
}

