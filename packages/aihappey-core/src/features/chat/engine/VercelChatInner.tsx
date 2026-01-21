import { DefaultChatTransport, FileUIPart, SourceDocumentUIPart, SourceUrlUIPart, useChat } from "aihappey-ai";
import { useConversations } from "aihappey-conversations";
import { useAppStore } from "aihappey-state";
import { useCallback, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { AttachmentsDrawer, MessageSourcesDrawer, useTheme } from "aihappey-components";
import { useFiles } from "aihappey-files";
import { ActivityDrawer } from "../activity/drawer/ActivityDrawer";
import { MessageInput } from "../input/MessageInput";
import { useAttachmentParts } from "../messages/useAttachmentParts";
import { useChatFileDrop } from "../input/useChatFileDrop";
import { useOnToolCall } from "../../tools/toolcalls/useOnToolCall";
import { MessageList } from "../messages/MessageList";
import { SYSTEM_ROLE, type UIMessage } from "aihappey-types";
import { useChatActions } from "./useChatActions";
import { useSystemMessage } from "../messages/useSystemMessage";
import { useChatContext } from "../context/ChatContext";
import { useChatErrors } from "../layout/useChatErrors";
import { ChatErrors } from "../layout/ChatErrors";
import { useAccessToken } from "aihappey-auth";
import { ToolDrawer } from "../../tools";
import { getToolName, useTools } from "../../tools/useTools";
import { useActiveProviderMetadata } from "./useActiveProviderMetadata";
import { conversationName } from "../../../runtime/chat-app/conversationName";
import { fileAttachmentRuntime } from "../../../runtime/files/fileAttachmentRuntime";
import { MessageActivityDrawer } from "../activity/drawer/MessageActivityDrawer";
import { ToolCallResultModal } from "../activity/content/ToolCallResultModal";
import { useAuthFetch } from "./useAuthFetch";
import { usePendingMessageAutoSend } from "./usePendingMessageAutoSend";
import { useAbortRun } from "./useAbortRun";
import { useApiRef } from "./useApiRef";
import { ElicitationModalHost } from "../../elicitation/ElicitationModalHost";
import { ToolApprovalModalHost } from "../../tools/ToolApprovalModalHost";
import { sendAutomaticallyWhen } from "./sendAutomaticallyWhen";
import { useIsDesktop } from "../../../shell/responsive/useIsDesktop";
import { countCompletedToolCallsLastAssistant } from "./countCompletedToolCallsLastAssistant";
import { shouldForceToolChoiceNone } from "./shouldForceToolChoiceNone";
import { T } from "react-router/dist/development/index-react-server-client-gGyf-7Xp";
import { useTranslation } from "aihappey-i18n";
import { useAttachmentsToaster } from "./useAttachmentsToaster";

/*────────────────────────  INNER CHAT  ───────────────────────────*/
export function VercelChatInner({
  getAccessToken,
  headers,
  temperature,
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
  const { addChatError } = useChatErrors();
  const [sources, setSources] = useState<(SourceUrlUIPart | SourceDocumentUIPart)[] | undefined>(undefined);
  const [messageActivity, setMessageActivity] = useState<any[] | undefined>(undefined);
  const [showToolCall, setShowToolCall] = useState<any | undefined>(undefined);
  const [messageAttachments, setMessageAttachments] = useState<FileUIPart[] | undefined>(undefined);
  const [usedTools, setUsedTool] = useState<any[] | undefined>(undefined);
  const { addMessage, rename, updateMessage, get } = useConversations();
  const experimentalThrottle = useAppStore((s) => s.experimentalThrottle);
  const customHeaders = useAppStore((s) => s.customHeaders);
  const navigate = useNavigate();
  const debugMode = useAppStore((a) => a.debugMode);
  const chatMode = useAppStore((a) => a.chatMode);
  const stopTools = useAppStore((a) => a.stopTools);
  const toolChoice = useAppStore((a) => a.toolChoice);
  const maxToolCalls = useAppStore((a) => a.maxToolCalls);
  const maxOutputTokens = useAppStore((a) => a.maxOutputTokens);
  const callTool = useAppStore((a) => a.callTool);
  const providerMetadata = useActiveProviderMetadata();
  const files = useFiles();
  const model = useAppStore((s) => s.selectedModel);
  const includeSystem = chatMode !== "agent";
  const { Spinner, JsonViewer, Toast } = useTheme();
  const { config } = useChatContext();
  const { t } = useTranslation();

  /* const [toast, setToast] = useState<{
     id: string;
     variant: "info" | "success" | "error";
     message: any;
     show: boolean;
     autohide?: number;
   }>({
     id: "add-to-files",
     variant: "success",
     message: "",
     show: false,
     autohide: 2500,
   });*/

  const isDesktop = useIsDesktop();
  const handoffs = useAppStore(a => a.handoffs)
  const maximumIterationCount = useAppStore(a => a.maximumIterationCount)

  const addAttachmentWithTranscription = async (file: File) => {

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

  const apiKeyHeaders: any = Object.fromEntries(
    Object.entries(customHeaders)
      .filter(([key]) => model && key.toLocaleLowerCase().indexOf(model.split("/")[0]) > -1)
  );

  const authFetch = useAuthFetch({
    chatMode,
    getAccessToken,
    refreshToken,
    headers,
    customHeaders: apiKeyHeaders,
    customFetch,
  });

  const api = chatMode === "agent"
    ? config?.agentEndpoint + "/api/chat"
    : config.baseUrl + config.endpoints.chat;

  const toolUse = useOnToolCall({
    api: config.baseUrl,
    getAccessToken,
    headers,
    customFetch,
    callTool,
  });

  const apiRef = useApiRef(api);
  const { tools } = useTools();
  const baseBody = useMemo(() => ({
    model: model ?? "openai/gpt-5.2",
    tools,
    agents: location.state?.agents,
    workflowType: location.state?.workflowType,
    maxOutputTokens,
    toolChoice,
    maxToolCalls,
    providerMetadata,
    response_format: location.state?.responseFormat,
    workflowMetadata: {
      groupchat: { maximumIterationCount },
      handoff: { handoffs },
    },
    temperature: location.state?.temperature ?? temperature,
  }), [
    model,
    tools,
    maxOutputTokens,
    toolChoice,
    maxToolCalls,
    location.state?.agents,
    location.state?.workflowType,
    location.state?.responseFormat,
    providerMetadata,
    maximumIterationCount,
    handoffs,
    temperature,
    location.state?.temperature,
  ]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat", // just a fallback; we override per-request below
        fetch: authFetch,
        prepareSendMessagesRequest: (opts) => {
          const mergedBody: any = {
            ...baseBody,          // default body (includes toolChoice)
            ...(opts.body ?? {}), // per-call overrides
            id: opts.id,
            messages: opts.messages,
            trigger: opts.trigger,
            messageId: opts.messageId,
          };

          const completedToolCalls =
            typeof maxToolCalls === "number"
              ? countCompletedToolCallsLastAssistant(opts.messages as any[])
              : 0;

          const forceNone =
            shouldForceToolChoiceNone(opts.messages as any[], stopTools) ||
            (typeof maxToolCalls === "number" && completedToolCalls >= maxToolCalls);

          const effectiveToolChoice = forceNone ? "none" : mergedBody.toolChoice;

          return {
            headers: opts.headers,
            credentials: opts.credentials,
            body: {
              ...mergedBody,
              toolChoice: effectiveToolChoice,
            },
            api: apiRef.current,
          };
        },
      }),
    [authFetch]
  );

  const { messages, sendMessage, status, addToolOutput, stop, addToolApprovalResponse } = useChat({
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
    sendAutomaticallyWhen,
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

  const { abortRef, startRun, cancelRun } = useAbortRun(stop);
  const getAttachmentParts = useAttachmentParts();

  const lastPart =
    messages.at(-1)?.role === "assistant"
      ? messages.at(-1)?.parts?.at(-1)?.type?.startsWith("tool-") &&
        typeof messages.at(-1)?.parts?.at(-1)?.state === "string" &&
        messages.at(-1)?.parts?.at(-1)?.state.startsWith("input-")
        ? messages.at(-1)!.parts!.at(-1)
        : undefined
      : undefined;

  const totalTokens = [...messages]
    .reverse()
    .find(m => m.role === "assistant" && m.metadata?.totalTokens != null)
    ?.metadata?.totalTokens;

  usePendingMessageAutoSend({
    conversationId,
    locationState: location.state,
    messages,
    addMessage,
    sendMessage,
    startRun,
    navigate,
    rename,
    getConversation: get,
    conversationName,
    body: {
      model: model ?? "openai/gpt-5.2",
      tools,
      maxOutputTokens,
      toolChoice,
      maxToolCalls,
      agents: location.state?.agents,
      workflowType: location.state?.workflowType,
      providerMetadata,
      response_format: location.state?.responseFormat,
      workflowMetadata: {
        groupchat: { maximumIterationCount },
        handoff: { handoffs },
      },
      temperature: location.state?.temperature ?? temperature,
    },
    files,
  });

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

  const toolName = lastPart ?
    (tools.find(a => a.name == getToolName(lastPart?.type))?.annotations?.title
      ?? getToolName(lastPart?.type))
    : undefined;

  const drawerSize = isDesktop ? "medium" : "small"
  const { toast, closeToast, addAttachmentToFiles } = useAttachmentsToaster();

  /*

const blobFromDataUrl = useCallback((dataUrl: string) => {
  const [prefix, data] = dataUrl.split(",", 2);
  if (!data) throw new Error("Invalid data URL");

  const mimeMatch = prefix.match(/data:([^;]+);base64/i);
  const inferredMime = mimeMatch?.[1];

  const byteChars = atob(data);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], {
    type: inferredMime || "application/octet-stream",
  });
}, []);

const makeUniqueName = useCallback((name: string) => {
  const existing = new Set((files.items ?? []).map((f) => f.name));
  if (!existing.has(name)) return name;

  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";

  let i = 2;
  while (existing.has(`${base} (${i})${ext}`)) i++;
  return `${base} (${i})${ext}`;
}, [files.items]);

const addAttachmentToFiles = useCallback(
  async (part: FileUIPart) => {
    try {
      const { url, mediaType, providerMetadata } = part;
      if (!url) return;

      // Prefer server-provided filename when present
      const suggestedName =
        providerMetadata?.openai?.filename?.toString() ||
        `attachment-${Date.now()}`;

      let blob: Blob;
      if (url.startsWith("data:")) {
        blob = blobFromDataUrl(url);
      } else if (url.startsWith("http")) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch attachment: ${res.status}`);
        blob = await res.blob();
      } else {
        // Some backends may send raw base64 without the data: prefix.
        // Treat it as base64 payload.
        const byteChars = atob(url);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteNumbers[i] = byteChars.charCodeAt(i);
        }
        blob = new Blob([new Uint8Array(byteNumbers)], {
          type: mediaType || "application/octet-stream",
        });
      }

      const finalMime = mediaType || blob.type || "application/octet-stream";
      const finalName = makeUniqueName(suggestedName);

      await files.create({
        name: finalName,
        mimeType: finalMime,
        data: blob,
      });

      files.refresh();

      setToast({
        id: `add-to-files-${Date.now()}`,
        variant: "success",
        message: t('fileAdded', { filename: finalName }),
        show: true,
        autohide: 2500,
      });
    } catch (e) {
      console.error("Add-to-files failed", e);

      setToast({
        id: `add-to-files-${Date.now()}`,
        variant: "error",
        message: "Failed to add file",
        show: true,
        autohide: 3500,
      });
    }
  },
  [blobFromDataUrl, files, makeUniqueName]
);*/

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
      <Toast
        id={toast.id}
        variant={toast.variant}
        message={toast.message}
        show={toast.show}
        autohide={toast.autohide}
        onClose={closeToast}
      />
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
            }}
            showAttachments={setMessageAttachments}
            showCitations={setSources}
            showActivity={setMessageActivity}
            conversationId={conversationId}
          />}

        {status === "submitted" || status === "streaming" || lastPart ? (
          <Spinner
            label={toolName}
          />
        ) : undefined}
        <div style={{ paddingRight: 24, paddingTop: 8, boxSizing: "border-box" }}>
          <MessageInput
            onSend={async (msg) => {
              startRun()
              await handleSend(msg)
            }}
            onStop={cancelRun}
            tokenUsage={totalTokens}
            temperature={temperature}
            temperatureChanged={temperatureChanged}
            onPromptExecute={onPromptExecute}
            disabled={status === "submitted" || status === "streaming"}
            streaming={status === "submitted" || status === "streaming"}
          />
        </div>
      </div>

      <MessageSourcesDrawer
        open={sources != undefined}
        sources={sources?.filter(a => a.type == "source-url") ?? []}
        size={drawerSize}
        onClose={() => setSources(undefined)} />

      <ToolDrawer open={usedTools != undefined}
        tools={usedTools ?? []}
        onClose={() => setUsedTool(undefined)} />

      <AttachmentsDrawer
        open={messageAttachments != undefined}
        size={drawerSize}
        attachments={messageAttachments ?? []}
        onAddToFiles={addAttachmentToFiles}
        onClose={() => setMessageAttachments(undefined)} />

      <ActivityDrawer messages={messages} />

      <MessageActivityDrawer open={messageActivity != undefined}
        content={messageActivity ?? []}
        onShowToolCallResult={(a) => setShowToolCall(a)}
        onClose={() => setMessageActivity(undefined)} />

      <ToolCallResultModal
        open={showToolCall != undefined}
        result={showToolCall?.output}
        onClose={() => setShowToolCall(undefined)}
      />

      <ToolApprovalModalHost
        messages={messages}
        tools={tools}
        status={status}
        addToolApprovalResponse={addToolApprovalResponse}

      />

      <ElicitationModalHost />
    </div>
  );
}
