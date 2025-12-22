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
import { ChatErrors } from "./layout/ChatErrors";
import { PromptWithSource } from "../mcp-prompts/PromptSelectButton";
import { useTranscription } from "../transcription/useTranscription";
import { extractTextFromZip } from "./files/fileConverters";
import { extractTextFromFile } from "./files/file";
import { toMarkdownLinkSmart } from "./files/markdown";
import { useChatContext } from "./context/ChatContext";
import { mcpResourceRuntime, useSelectedResources } from "../../runtime/mcp/mcpResourceRuntime";
import { fileAttachmentRuntime, useFileAttachments } from "../../runtime/files/fileAttachmentRuntime";

export function NewChatPage() {
  const navigate = useNavigate();
  const { create } = useConversations();
  const { config } = useChatContext();
  const [creating, setCreating] = useState(false);
  const selectedAgentNames = useAppStore(a => a.selectedAgentNames)
  const agents = useAppStore(a => a.agents)
  const selectedAgents = selectedAgentNames
    .filter(a => agents.some(z => z.name == a))
    .map(a => agents.find(z => z.name == a)!)
  //const addAttachment = useAppStore((s) => s.addAttachment);
  const temperature = useAppStore((s) => s.temperature);
  const structuredOutputs = useAppStore((s) => s.structuredOutputs);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const setTemperature = useAppStore((s) => s.setTemperature);
  // const attachments = useAppStore((s) => s.attachments as UiAttachment[]);
  // const clearAttachments = useAppStore((s) => s.clearAttachments);
  const workflowType = useAppStore((s) => s.workflowType);
  const setSelectedAgents = useAppStore((s) => s.setSelectedAgents);
  const { transcribe } = useTranscription(
    config.transcriptionApi!,
    config.getAccessToken
  );

  const addAttachmentWithTranscription = async (file: File) => {
    if (file.type.startsWith("audio/")) {
      // Optionally show spinner/loading in your UI
      const transcript = await transcribe(file);
      if (transcript) {
        const transcriptFile = new File(
          [transcript], // Blob parts
          file.name.replace(/\.[^.]+$/, ".txt"), // New name
          { type: "text/plain" } // MIME type
        );
        // Now add as file (same as regular attachment)
        fileAttachmentRuntime.add(transcriptFile);

        return; // If you ONLY want the transcript, otherwise remove this
      }
    }
    // Fallback: just add as normal file attachment
    fileAttachmentRuntime.add(file);
  };

  const { isOver, dropRef, handleDrop, handleDragOver } = useChatFileDrop(
    addAttachmentWithTranscription
  );

  const attachments = useFileAttachments(fileAttachmentRuntime)
  const getAttachmentParts = async () => {
    const textAttachments: any[] = [];

    for (const a of attachments) {
      if (a.type === "application/zip" || /\.zip$/i.test(a.name)) {
        textAttachments.push(...(await extractTextFromZip(a)));
      } else {
        const text = await extractTextFromFile(a);
        if (text) {
          textAttachments.push({
            type: "text",
            text: toMarkdownLinkSmart(a.name, text, a.type),
          });
        }
      }
    }

    return textAttachments;
  };

  const resourceParts = useResourceParts();
  const extractExif = useAppStore(a => a.extractExif)
  const { buildFromText, buildFromPrompt } = useUserMessageBuilder({
    getAttachmentParts,
    extractExif,
  });

  const startNewConversation = async (userMsg: any) => {
    if (!userMsg) return;
    const conv = await create("New chat", temperature);
    await navigate(`/${conv.id}`, {
      state: {
        pendingMessage: userMsg,
        model: selectedModel,
        workflowType: workflowType,
        temperature,
        agents: selectedAgents,
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
      const userMsg = await buildFromText(content);
      await startNewConversation(userMsg);
    },
    [creating, temperature, selectedModel, workflowType,
      selectedAgents, resourceParts, attachments] // minimal deps, don't need attachments/resourceParts (not used)
  );

  const onPromptExecute = async (
    prompt: PromptWithSource,
    args?: Record<string, string>
  ) => {
    const userMsg = await buildFromPrompt(prompt, args);
    await startNewConversation(userMsg);
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
        agentValues={selectedAgents?.map(a => a.name) ?? []}
        onAgentChange={(name) => selectedAgentNames.includes(name)
          ? setSelectedAgents(selectedAgentNames.filter(a => a != name))
          : setSelectedAgents([...selectedAgentNames, name])} />
      <div
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
