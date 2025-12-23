import { DefaultChatTransport, useChat } from "aihappey-ai";
import { useConversations } from "aihappey-conversations";
import { useAppStore, UiAttachment } from "aihappey-state";
import { useMemo, useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { useTheme } from "aihappey-components";

import { SimpleActivityDrawer } from "../activity/drawer/SimpleActivityDrawer";
import { MessageInput } from "../input/MessageInput";
import { useAttachmentParts } from "../messages/useAttachmentParts";
import { useChatFileDrop } from "../input/useChatFileDrop";
import { useOnToolCall } from "../../tools/useOnToolCall";
import { useResourceParts } from "../messages/useResourceParts";
import { MessageList } from "../messages/MessageList";
import { SYSTEM_ROLE, type UIMessage } from "aihappey-types";
import { useChatActions } from "./useChatActions";
import { useSystemMessage } from "../messages/useSystemMessage";
import { useChatContext } from "../context/ChatContext";
import { useTranscription } from "../../transcription/useTranscription";
import { useChatErrors } from "../layout/useChatErrors";
import { ChatErrors } from "../layout/ChatErrors";
import { useAccessToken } from "aihappey-auth";
import { CitationDrawer } from "../citations/CitationDrawer";
import { ToolDrawer } from "../../tools";
import { useTools } from "../../tools/useTools";
import { AttachmentsDrawer } from "../attachments/AttachmentsDrawer";
import { useActiveProviderMetadata } from "./useActiveProviderMetadata";
import { conversationName } from "../../../runtime/chat-app/conversationName";
import { fileAttachmentRuntime } from "../../../runtime/files/fileAttachmentRuntime";
import { MessageActivityDrawer } from "../activity/drawer/MessageActivityDrawer";
import { ToolCallResultModal } from "../activity/content/ToolCallResultModal";

/*────────────────────────  INNER CHAT  ───────────────────────────*/
export function VercelChatInner({
  getAccessToken,
  headers,
  temperature,
  // model,
  temperatureChanged,
  customFetch,
  initial,
}: {
  // model?: string;
  temperature?: number;
  temperatureChanged?: (temperature: number) => Promise<void>;
  getAccessToken?: () => Promise<string>;
  headers?: Record<string, string>;
  customFetch?: typeof fetch;
  initial: UIMessage[];
}) {
  const { conversationId } = useParams<{ conversationId: string }>();
  const location = useLocation();
  const { errors, dismissError, addChatError } = useChatErrors();
  const [sources, setSources] = useState<any[] | undefined>(
    undefined
  );
  const [messageActivity, setMessageActivity] = useState<any[] | undefined>(
    undefined
  );
  const [showToolCall, setShowToolCall] = useState<any | undefined>(
    undefined
  );

  const [messageAttachments, setMessageAttachments] = useState<any[] | undefined>(
    undefined
  );
  const [usedTools, setUsedTool] = useState<any[] | undefined>(
    undefined
  );
  const { addMessage, rename, updateMessage, get } = useConversations();
  const experimentalThrottle = useAppStore((s) => s.experimentalThrottle);
  const customHeaders = useAppStore((s) => s.customHeaders);
  const navigate = useNavigate();
  // const conv = useConversations();
  const debugMode = useAppStore((a) => a.debugMode);
  const chatMode = useAppStore((a) => a.chatMode);
  const callTool = useAppStore((a) => a.callTool);
  const providerMetadata = useActiveProviderMetadata();
  const model = useAppStore((s) => s.selectedModel);
  const didAutoSendRef = useRef(false);
  const includeSystem = chatMode !== "agent";
  const { Spinner, JsonViewer } = useTheme();
  const { config } = useChatContext();
  const { transcribe } = useTranscription(
    config.transcriptionApi!,
    config.getAccessToken
  );
  const handoffs = useAppStore(a => a.handoffs)
  const maximumIterationCount = useAppStore(a => a.maximumIterationCount)

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

  const systemMessage = useSystemMessage();
  const seededMessages = useMemo(() => {
    const nonSystem = initial.filter((a) => a.role !== SYSTEM_ROLE);
    return includeSystem ? [systemMessage, ...nonSystem] : nonSystem;
  }, [includeSystem, systemMessage, initial]);

  const [, , , refreshToken] = useAccessToken(config.agentScopes ?? []);

  // keep latest values in refs (no stale closures)
  const chatModeRef = useRef(chatMode);
  useEffect(() => { chatModeRef.current = chatMode; }, [chatMode]);

  const getAccessTokenRef = useRef(getAccessToken);
  useEffect(() => { getAccessTokenRef.current = getAccessToken; }, [getAccessToken]);

  const refreshTokenRef = useRef(refreshToken);
  useEffect(() => { refreshTokenRef.current = refreshToken; }, [refreshToken]);

  const headersRef = useRef(headers);
  useEffect(() => { headersRef.current = headers; }, [headers]);

  const customHeadersRef = useRef(customHeaders);
  useEffect(() => { customHeadersRef.current = customHeaders; }, [customHeaders]);

  const customFetchRef = useRef(customFetch);
  useEffect(() => { customFetchRef.current = customFetch; }, [customFetch]);

  /* auth-aware fetch that always uses CURRENT chatMode + token callbacks */
  const authFetch = useMemo(() => {
    // if literally nothing is provided, skip
    if (
      !getAccessTokenRef.current &&
      !headersRef.current &&
      !customFetchRef.current &&
      !customHeadersRef.current &&
      !refreshTokenRef.current
    ) return undefined;

    return async (input: RequestInfo | URL, init?: RequestInit) => {
      const mode = chatModeRef.current;

      // start with base headers
      const h = new Headers();
      const base = { ...(headersRef.current ?? {}), ...(customHeadersRef.current ?? {}) };
      Object.entries(base).forEach(([k, v]) => { if (v != null) h.set(k, String(v)); });

      // merge init headers next (so caller can set stuff)
      if (init?.headers) {
        new Headers(init.headers as any).forEach((v, k) => h.set(k, v));
      }

      // now set Authorization last (so it wins)
      try {
        if (mode === "chat" && getAccessTokenRef.current) {
          const token = await getAccessTokenRef.current();
          if (token) h.set("Authorization", `Bearer ${token}`);
        } else if (mode === "agent" && refreshTokenRef.current) {
          const token = await refreshTokenRef.current();
          if (token) h.set("Authorization", `Bearer ${token}`);
        }
      } catch {
        // swallow: keep whatever Authorization (if any) was already there
      }

      const f = customFetchRef.current ?? fetch;
      return f(input, { ...init, headers: h });
    };
  }, []); // <-- stable forever, reads refs at call time

  const startRun = () => {
    abortRef.current?.abort();         // kill previous run
    abortRef.current = new AbortController();
  };

  const api = chatMode == "agent" ? config?.agentEndpoint + "/api/chat"
    : config?.api || "/api/chat";

  const abortRef = useRef<AbortController | null>(null);
  const toolUse = useOnToolCall({
    callTool,
  });

  const apiRef = useRef(api);
  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat", // just a fallback; we override per-request below
        fetch: authFetch,
        prepareSendMessagesRequest: (opts) => ({
          // force the CURRENT endpoint at request time:
          headers: opts.headers,
          credentials: opts.credentials,
          body: {
            ...(opts.body ?? {}),              // <- body MUST be object
            id: opts.id,
            messages: opts.messages,           // <- keep core payload
            // optioneel (meestal harmless):
            trigger: opts.trigger,
            messageId: opts.messageId,
          },
          api: apiRef.current,
        }),
      }),
    [authFetch]
  );

  const { messages, sendMessage, status, addToolOutput, stop } = useChat({
    id: conversationId,
    transport,
    experimental_throttle: experimentalThrottle,
    onError: addChatError,
    onToolCall: async ({ toolCall }) => {
      const result = await (toolUse.onToolCall as any)({
        toolCall,
        signal: abortRef.current?.signal
      });

      addToolOutput({
        tool: toolCall.toolName,
        toolCallId: toolCall.toolCallId,
        output: result,
      });

      return result;
    },
    sendAutomaticallyWhen: (options) => {
      const messages = options?.messages || [];
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== "assistant") return false;
      const parts = lastMessage.parts || [];
      return parts[parts.length - 1]?.state === "output-available" && !parts[parts.length - 1]?.providerExecuted;
    },
    messages: seededMessages,
    onFinish: async ({ message, isDisconnect, isAbort }) => {
      if (!isAbort) {
        if (message.role === "assistant")
          // await addMessage(conversationId!, message as UIMessage);
          try {
            await updateMessage(
              conversationId!,
              message?.id,
              message as UIMessage
            );
          } catch (e) {
            await addMessage(conversationId!, message as UIMessage);
          }
      }
    },
  });

  const cancelRun = async () => {
    abortRef?.current?.abort()
    await stop();
  }

  const getAttachmentParts = useAttachmentParts();
  const { tools } = useTools();
  const lastPart = useMemo(() => {
    const lastMsg =
      messages.length > 0 ? messages[messages.length - 1] : undefined;
    if (
      lastMsg &&
      lastMsg.role === "assistant" &&
      Array.isArray(lastMsg.parts) &&
      lastMsg.parts.length > 0
    ) {
      const lastPart = lastMsg.parts[lastMsg.parts.length - 1];
      if (
        lastPart.type?.startsWith("tool-") &&
        typeof lastPart.state === "string" &&
        lastPart.state.startsWith("input-")
      ) {
        return lastPart;
      }
    }
    return undefined;
  }, [messages]);

  useEffect(() => {
    const pending = location.state?.pendingMessage;
    if (!pending) return;
    if (!conversationId) return;

    // IMPORTANT: React StrictMode runs effects twice in dev
    if (didAutoSendRef.current) return;
    didAutoSendRef.current = true;

    const handleData = async () => {
      //if (pending && messages.length === 1) {
      await addMessage(conversationId!, pending);
      startRun()
      await sendMessage(pending, {
        body: {
          model: model ?? "openai/gpt-5.2",
          tools,
          agents: location.state.agents,
          workflowType: location.state.workflowType,
          providerMetadata,
          response_format: location.state.responseFormat,
          workflowMetadata: {
            groupchat: {
              maximumIterationCount
            },
            handoff: {
              handoffs
            },
          },
          temperature: location.state?.temperature ?? temperature
           // location.state?.temperature != undefined
           //   ? location.state?.temperature
           //   : temperature,
        },
      });
      // router state wissen
      await navigate(`/${conversationId}`, { replace: true, state: {} });

      const name = await conversationName(
        pending?.parts
          .filter((a: any) => a.type == "text")
          .map((z: any) => z.text)
          .join("\n\n"),
      )
      if (name) {
        document.title = name;
        rename(conversationId!, name)
      }
    }
    handleData()


    //  }
  }, [conversationId, location.state, messages, addMessage, rename, tools, providerMetadata,
    sendMessage, model, conversationId, navigate]);

  const { onPromptExecute, handleSend } = useChatActions({
    getAttachmentParts,
    addMessage,
    sendMessage,
    temperature,
    selectedModel: model,
    conversationId,
    finalTools: tools,
    rename,
  });

  const toolName = lastPart ? tools.find(a => a.name == lastPart?.type.replace("tool-", ""))?.annotations?.title : undefined;


  /* very bare‑bones UI */
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
        width: "100%",
        flex: 1,
        overflowY: "auto",
        minHeight: 0, // important for flex scroll containers!
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
          border: isOver ? "2px dotted" : undefined,
          borderColor: isOver ? "#888" : "transparent",
        }}
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <ChatErrors />
        {debugMode ? <JsonViewer value={JSON.stringify(messages)} />
          : <MessageList
            messages={messages}
            sendMessage={async (msg: any) => {
              startRun()
              await handleSend(msg.prompt)
              const conv11 = await get(conversationId!);
              console.log("AFTER WRITE", conv11?.messages.map(m => ({
                role: m.role,
                id: m.id,
                ts: m.metadata?.timestamp,
                createdAt: (m as any).createdAt
              })));
            }}
            showAttachments={setMessageAttachments}
            showCitations={setSources}
            showActivity={setMessageActivity}
            conversationId={conversationId}
            showToolsDrawer={setUsedTool}
          />}
        {status === "submitted" || status === "streaming" || lastPart ? (
          <Spinner
            label={
              toolName
            }
          />
        ) : undefined}
        <div style={{ paddingRight: 24, paddingTop: 8, boxSizing: "border-box" }}>
          <MessageInput
            onSend={async (msg: any) => {
              startRun()
              await handleSend(msg)
            }}
            onStop={cancelRun}
            temperature={temperature}
            temperatureChanged={temperatureChanged}
            onPromptExecute={onPromptExecute}
            disabled={status === "submitted" || status === "streaming"}
            streaming={status === "submitted" || status === "streaming"}
          />
        </div>
      </div>
      <CitationDrawer open={sources != undefined}
        sources={sources ?? []}
        onClose={() => setSources(undefined)} />
      <ToolDrawer open={usedTools != undefined}
        tools={usedTools ?? []}
        onClose={() => setUsedTool(undefined)} />
      <AttachmentsDrawer open={messageAttachments != undefined}
        attachments={messageAttachments ?? []}
        onClose={() => setMessageAttachments(undefined)} />
      <SimpleActivityDrawer messages={messages} />
      <MessageActivityDrawer open={messageActivity != undefined}
        content={messageActivity ?? []}
        onShowToolCallResult={(a) => setShowToolCall(a)}
        onClose={() => setMessageActivity(undefined)} />
      <ToolCallResultModal
        open={showToolCall != undefined}
        result={showToolCall?.output}
        onClose={() => setShowToolCall(undefined)}
      />
    </div>
  );
}
