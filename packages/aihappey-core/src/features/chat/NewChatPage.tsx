import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { useConversations } from "aihappey-conversations";
import { MessageInput } from "./input/MessageInput";
import { ChatHeader } from "./layout/ChatHeader";
import { WelcomeMessage } from "./messages/WelcomeMessage";
import { useAppStore } from "aihappey-state";
import { useChatFileDrop } from "./input/useChatFileDrop";
import { DisclaimerBar } from "./layout/DisclaimerBar";
import { useUserMessageBuilder } from "./messages/useUserMessageBuilder";
import { useResourceParts } from "./messages/useResourceParts";
import { useAttachmentParts } from "./messages/useAttachmentParts";
import { ChatErrors } from "./layout/ChatErrors";
import { useChatErrors } from "./layout/useChatErrors";
import { PromptWithSource } from "../mcp-prompts/PromptSelectButton";
import { mcpResourceRuntime } from "../../runtime/mcp/mcpResourceRuntime";
import { fileAttachmentRuntime, useFileAttachments } from "../../runtime/files/fileAttachmentRuntime";
import { useStorageErrorMessage } from "../storage/storageErrorMessage";
import { buildSelectedAgentRequest } from "../agents/agentSelection";

export function NewChatPage() {
  const navigate = useNavigate();
  const { create } = useConversations();
  const { addChatError } = useChatErrors();
  const getStorageErrorMessage = useStorageErrorMessage();
  const [creating, setCreating] = useState(false);
  const selectedAgentNames = useAppStore(a => a.selectedAgentNames)
  const agents = useAppStore(a => a.agents)
  const remoteAgentModels = useAppStore(a => a.remoteAgentModels)
  const temperature = useAppStore((s) => s.temperature);
  const structuredOutputs = useAppStore((s) => s.structuredOutputs);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const setTemperature = useAppStore((s) => s.setTemperature);
  const workflowType = useAppStore((s) => s.workflowType);
  const setSelectedAgents = useAppStore((s) => s.setSelectedAgents);
  const addAttachmentWithTranscription = async (file: File) => {

    // Fallback: just add as normal file attachment
    fileAttachmentRuntime.add(file);
  };

  const { isOver, dropRef: drop, handleDrop, handleDragOver } = useChatFileDrop(
    addAttachmentWithTranscription
  );


  const dropRef = useCallback((node: HTMLDivElement | null) => {
    if (node) drop(node);
  }, [drop]);

  // NewChatPage uses the shared attachment conversion rules via useAttachmentParts
  const getAttachmentParts = useAttachmentParts();

  const resourceParts = useResourceParts();
  const extractExif = useAppStore(a => a.extractExif)
  const { buildFromText, buildFromPrompt } = useUserMessageBuilder({
    getAttachmentParts,
    extractExif,
  });
  const selectedAgentRequest = buildSelectedAgentRequest(
    selectedAgentNames,
    agents,
    remoteAgentModels,
  );

  const startNewConversation = async (userMsg: any) => {
    if (!userMsg) return;
    const conv = await create("New chat", temperature);
    await navigate(`/${conv.id}`, {
      state: {
        pendingMessage: userMsg,
        model: selectedModel,
        workflowType: workflowType,
        temperature,
        agents: selectedAgentRequest.localAgents,
        models: selectedAgentRequest.models,
        responseFormat: structuredOutputs
      },
    });
    fileAttachmentRuntime.clear()
    mcpResourceRuntime.clear();
  };

  const handleFirstSend = useCallback(
    async (content: string) => {
      if (creating) return;
      setCreating(true);
      try {
        const userMsg = await buildFromText(content);
        await startNewConversation(userMsg);
      } catch (err) {
        addChatError(getStorageErrorMessage(err, "Failed to start a new chat"));
      } finally {
        setCreating(false);
      }
    },
    [addChatError, buildFromText, creating, startNewConversation]
  );

  const onPromptExecute = async (
    prompt: PromptWithSource,
    args?: Record<string, string>
  ) => {
    if (creating) return;
    setCreating(true);
    try {
      const userMsg = await buildFromPrompt(prompt, args);
      await startNewConversation(userMsg);
    } catch (err) {
      addChatError(getStorageErrorMessage(err, "Failed to start a new chat"));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      style={{
        height: "100dvh",
        minHeight: 0,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ChatHeader
        agentValues={selectedAgentNames ?? []}
        onAgentChange={(name) => selectedAgentNames.includes(name)
          ? setSelectedAgents(selectedAgentNames.filter(a => a != name))
          : setSelectedAgents([...selectedAgentNames, name])} />
      <div
        data-chat-resize-scope
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          border: isOver ? "2px dotted" : undefined,
          borderColor: isOver ? "#888" : "transparent",
          textAlign: "center",
        }}
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <ChatErrors />
        <div style={{ width: "95%" }}>
          <WelcomeMessage />
          <MessageInput
            temperature={temperature}
            temperatureChanged={setTemperature}
            onPromptExecute={onPromptExecute}
            onSend={handleFirstSend}
            disabled={creating}
          />
        </div>
      </div>
      <DisclaimerBar />
    </div>
  );
}
