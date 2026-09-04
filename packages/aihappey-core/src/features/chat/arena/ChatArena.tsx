import { useCallback, useMemo, useState } from "react";
import { MessageList } from "../messages/MessageList";
import { useTheme } from "aihappey-components";
import { DefaultChatTransport, useChat } from "aihappey-ai";
import { MessageInput } from "../input/MessageInput";
import { useAppStore } from "aihappey-state";
import { useChatFileDrop } from "../input/useChatFileDrop";
import { useChatAttachmentAdmission } from "../input/useChatAttachmentAdmission";
import { ChatErrors } from "../layout/ChatErrors";
import { useParams } from "react-router";
import { useConversations } from "aihappey-conversations";
import { useAttachmentParts } from "../messages/useAttachmentParts";
import { useResourceParts } from "../messages/useResourceParts";
import { useOnToolCall } from "../../tools/toolcalls/useOnToolCall";
import { ModelSelect } from "../../models/ModelSelect";
import { useChatContext } from "../context/ChatContext";
import { useSystemMessage } from "../messages/useSystemMessage";
import { useUserMessageBuilder } from "../messages/useUserMessageBuilder";
import { useTools } from "../../tools/useTools";
import { PromptWithSource } from "../../mcp-prompts/PromptSelectButton";
import { mcpResourceRuntime } from "../../../runtime/mcp/mcpResourceRuntime";
import { fileAttachmentRuntime } from "../../../runtime/files/fileAttachmentRuntime";
import { sendAutomaticallyWhen } from "../engine/sendAutomaticallyWhen";
import { mapToolOutputContentForRequest } from "../engine/mapToolOutputContentForRequest";

export function ChatArena({
  api,
  getAccessToken,
  headers,
  customFetch,
}: {
  api?: string;
  getAccessToken?: () => Promise<string>;
  headers?: Record<string, string>;
  customFetch?: typeof fetch;
}) {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { addMessage } = useConversations();
  const [selectedModelA, setSelectedModelA] = useState<string | undefined>(
    "openai/gpt-5-nano"
  );

  const [selectedModelB, setSelectedModelB] = useState<string | undefined>(
    "openai/gpt-4.1-nano"
  );

  const { config } = useChatContext();
  const { Spinner } = useTheme();
  const models = useAppStore((s) => s.models);
  const customHeaders = useAppStore((s) => s.customHeaders);
  const callTool = useAppStore((a) => a.callTool);
  const toolOutputContentSettings = useAppStore((a) => a.toolOutputContentSettings);
  const { onToolCall } = useOnToolCall({
    callTool,
    api: api ?? "",
    getAccessToken,
    conversationId,
    headers,
    customFetch,
    send: undefined
  });

  const addAttachments = useChatAttachmentAdmission();

  const { isOver, dropRef: drop, handleDrop, handleDragOver } = useChatFileDrop(
    (file) => addAttachments([file]),
    addAttachments,
  );




  const dropRef = useCallback((node: HTMLDivElement | null) => {
    if (node) drop(node);
  }, [drop]);

  const authFetch = useMemo(() => {
    if (!getAccessToken && !headers && !customFetch && !customHeaders) return undefined;
    return async (input: RequestInfo | URL, init?: RequestInit) => {
      let merged = { ...(headers ?? {}), ...(customHeaders ?? {}) };
      if (getAccessToken) {
        try {
          merged.Authorization = `Bearer ${await getAccessToken()}`;
        } catch { }
      }
      if (init?.headers) merged = { ...merged, ...(init.headers as any) };
      return (customFetch ?? fetch)(input, { ...init, headers: merged });
    };
  }, [getAccessToken, headers, customFetch, customHeaders]);

  const transport = useMemo(
    () => new DefaultChatTransport({
      api,
      fetch: authFetch,
      prepareSendMessagesRequest: (opts: any) => ({
        api,
        headers: opts.headers,
        credentials: opts.credentials,
        body: {
          ...(opts.body ?? {}),
          id: opts.id,
          messages: mapToolOutputContentForRequest(opts.messages, toolOutputContentSettings),
          trigger: opts.trigger,
          messageId: opts.messageId,
        },
      }),
    }),
    [api, authFetch, toolOutputContentSettings]
  );

  const systemMessage = useSystemMessage();

  const chatA = useChat({
    id: "arena-a",
    messages: systemMessage ? [systemMessage] : [],
    transport,
    onToolCall: async ({ toolCall }) => {
      const result = await (onToolCall as any)({ toolCall });
      chatA.addToolOutput({
        tool: toolCall.toolName,
        toolCallId: toolCall.toolCallId,
        output: result,
      });

      return result;
    },
    sendAutomaticallyWhen
    /*   sendAutomaticallyWhen: (options) => {
         const messages = options?.messages || [];
         const lastMessage = messages[messages.length - 1];
         if (!lastMessage || lastMessage.role !== "assistant") return false;
         const parts = lastMessage.parts || [];
         return parts[parts.length - 1]?.state === "output-available";
       },*/
  });

  const chatB = useChat({
    id: "arena-b",
    messages: systemMessage ? [systemMessage] : [],
    transport,
    onToolCall: async ({ toolCall }) => {
      const result = await (onToolCall as any)({ toolCall });
      chatB.addToolOutput({
        tool: toolCall.toolName,
        toolCallId: toolCall.toolCallId,
        output: result,
      });

      return result;
    },
    sendAutomaticallyWhen,
    /*sendAutomaticallyWhen: (options) => {
      const messages = options?.messages || [];
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== "assistant") return false;
      const parts = lastMessage.parts || [];
      return parts[parts.length - 1]?.state === "output-available";
    },*/
  });

  const { tools } = useTools();

  const getAttachmentParts = useAttachmentParts();
  const resourceParts = useResourceParts();

  // On user submit, fire both models
  const handleSend = useCallback(
    async (text: string) => {
      const userMsg = await buildFromText(text);

      if (userMsg) {
        await Promise.all([
          chatA.sendMessage(userMsg, {
            body: { model: selectedModelA, tools: tools },
          }),
          chatB.sendMessage(userMsg, {
            body: { model: selectedModelB, tools: tools },
          }),
        ]);

        fileAttachmentRuntime.clear();
        mcpResourceRuntime.clear();
      }
    },
    [
      resourceParts,
      getAttachmentParts,
      addMessage,
      selectedModelA,
      selectedModelB,
      selectedModelA,
      conversationId,
      tools,
    ]
  );
  const extractExif = useAppStore(a => a.extractExif)
  const { buildFromText, buildFromPrompt } = useUserMessageBuilder({
    getAttachmentParts,
    extractExif,
  });

  const onPromptExecute = useCallback(
    async (prompt: PromptWithSource, args?: Record<string, string>) => {
      const userMsg = await buildFromPrompt(prompt, args);

      if (userMsg) {
        await Promise.all([
          chatA.sendMessage(userMsg, {
            body: { model: selectedModelA, tools: tools },
          }),
          chatB.sendMessage(userMsg, {
            body: { model: selectedModelB, tools: tools },
          }),
        ]);

        fileAttachmentRuntime.clear();
        mcpResourceRuntime.clear();
      }
    },
    [
      resourceParts,
      getAttachmentParts,
      selectedModelA,
      selectedModelB,

      conversationId,
      tools,
    ]
  );

  return (
    <div
      data-chat-resize-scope
      ref={dropRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh", // 100% of viewport
        minHeight: 0, // fixes some flexbox browser bugs
      }}
    >
      {/* ARENA */}
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          overflow: "hidden", // Prevents outer scrollbar
        }}
      >
        {/* LEFT CHAT */}
        <div
          style={{
            flex: 1,
            borderRight: "1px solid #333",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div style={{ padding: 8, fontWeight: "bold" }}>
            <ModelSelect
              models={models ?? []}
              value={selectedModelA ?? ""}
              onChange={setSelectedModelA}
            />
          </div>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto", // only this scrolls
            }}
          >
            <MessageList
              messages={chatA.messages}
              showCitations={function (items: any[]): void {
                throw new Error("Function not implemented.");
              }}
            />
          </div>
          {chatA.status === "streaming" && <Spinner />}
        </div>
        {/* RIGHT CHAT */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div style={{ padding: 8, fontWeight: "bold" }}>
            <ModelSelect
              models={models ?? []}
              value={selectedModelB ?? ""}
              onChange={setSelectedModelB}
            />
          </div>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
            }}
          >
            <MessageList
              messages={chatB.messages}
              showCitations={function (items: any[]): void {
                throw new Error("Function not implemented.");
              }}
            />
          </div>
          {chatB.status === "streaming" && <Spinner />}
        </div>
      </div>
      {/* INPUT BAR FIXED AT BOTTOM */}
      <div
        style={{
          paddingRight: 24,
          paddingTop: 8,
          boxSizing: "border-box",
        }}
      >
        <ChatErrors />
        <MessageInput
          onSend={handleSend}
          onPromptExecute={onPromptExecute}
          // fix status prop!
          disabled={
            chatA.status === "streaming" || chatB.status === "streaming"
          }
          streaming={
            chatA.status === "streaming" || chatB.status === "streaming"
          }
        //  providerMetadata={providerMetadata}
        // setProviderMetadata={setProviderMetadata}
        />
      </div>
    </div>
  );
}
