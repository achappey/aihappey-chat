import { DefaultChatTransport, FileUIPart, SourceDocumentUIPart, SourceUrlUIPart, useChat } from "aihappey-ai";
import { useConversations } from "aihappey-conversations";
import { useAppStore } from "aihappey-state";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useTranslation } from "aihappey-i18n";
import { useAttachmentsToaster } from "./useAttachmentsToaster";
import { generateCatalogPrompt } from "../../json-render/generateCatalogPrompt";
import { catalog } from "../../json-render/catalog";
import { useUIStream } from "../../json-render/useUIStream";

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
  const { addMessage, rename, updateMessage, get, items } = useConversations();
  const experimentalThrottle = useAppStore((s) => s.experimentalThrottle);
  const customHeaders = useAppStore((s) => s.customHeaders);
  const navigate = useNavigate();
  const debugMode = useAppStore((a) => a.debugMode);
  const chatMode = useAppStore((a) => a.chatMode);
  const stopTools = useAppStore((a) => a.stopTools);
  const toolChoice = useAppStore((a) => a.toolChoice);
  const maxToolCalls = useAppStore((a) => a.maxToolCalls);
  const activeData = useAppStore((a) => a.activeData);
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

  const { isOver, dropRef: drop, handleDrop, handleDragOver } = useChatFileDrop(
    addAttachmentWithTranscription
  );

  const dropRef = useCallback((node: HTMLDivElement | null) => {
    if (node) drop(node);
  }, [drop]);

  const messageLength = items.find(a => a.id == conversationId)?.messages?.length ?? 0;
  const systemMessage = useSystemMessage();
  const seededMessages = useMemo(() => {
    const nonSystem = initial.filter((a) => a.role !== SYSTEM_ROLE);
    return includeSystem ? [systemMessage, ...nonSystem] : nonSystem;
  }, [includeSystem, systemMessage, initial, messageLength]);

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



  const systemPrompt = useMemo(() => generateCatalogPrompt(catalog), []);
  const { tree, send, isStreaming, error: streamError } = useUIStream({
    api: config.baseUrl + "/api/generate",
    catalogPrompt: systemPrompt,
    model: model,
    getAccessToken: getAccessToken,
    /*  onComplete: (nextTree: any) => {
        if (selectedConversationId) {
          setJsonRenderTree(selectedConversationId, nextTree);
        }
      },
      onError: (err: Error) => {
        if (selectedConversationId) {
          setJsonRenderError(selectedConversationId, err.message);
        }
      },*/
  });

  const sendUiRequest = async (prompt: string) => {
    let promptToSend = prompt;
    if (tree?.root && Object.keys(tree.elements || {}).length > 0) {
      promptToSend = `CURRENT UI STATE (already loaded, DO NOT recreate existing elements):\n${JSON.stringify(tree, null, 2)}\n\nUSER REQUEST: ${prompt}\n\nIMPORTANT: The current UI is already loaded. Output ONLY the patches needed to make the requested change:\n- To add a new element: {"op":"add","path":"/elements/new-key","value":{...}}\n- To modify an existing element: {"op":"set","path":"/elements/existing-key","value":{...}}\n- To update the root: {"op":"set","path":"/root","value":"new-root-key"}\n- To remove an element: {"op":"remove","path":"/root"}\n- To add children: update the parent element with new children array\n\nDO NOT output patches for elements that don't need to change. Only output what's necessary for the requested modification.`;
    }

    await send(promptToSend, activeData ?? {})
  }

  const toolUse = useOnToolCall({
    api: config.baseUrl,
    getAccessToken,
    conversationId,
    headers,
    customFetch,
    callTool,
    send: sendUiRequest
  });

  const apiRef = useApiRef(api);
  const { tools } = useTools();

  // Local UI overlay for edits/deletes (since `useChat()` doesn't expose `setMessages`).
  // We also re-use these overrides when building the next request body so deleted parts
  // are NOT sent to the backend on subsequent turns.
  const [uiMessageOverrides, setUiMessageOverrides] = useState<Record<string, UIMessage | null>>({});
  const uiMessageOverridesRef = useRef<Record<string, UIMessage | null>>({});
  useEffect(() => {
    uiMessageOverridesRef.current = uiMessageOverrides;
  }, [uiMessageOverrides]);

  const applyOverrides = useCallback((list: any[]) => {
    const ov = uiMessageOverridesRef.current;
    return (list ?? [])
      .map((m: any) => {
        const x = ov[m?.id];
        return x === undefined ? m : x;
      })
      .filter((m: any) => !!m);
  }, []);
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
          const patchedMessages = applyOverrides(opts.messages as any);
          const mergedBody: any = {
            ...baseBody,          // default body (includes toolChoice)
            ...(opts.body ?? {}), // per-call overrides
            id: opts.id,
            messages: patchedMessages,
            trigger: opts.trigger,
            messageId: opts.messageId,
          };

          const completedToolCalls =
            typeof maxToolCalls === "number"
              ? countCompletedToolCallsLastAssistant(patchedMessages as any[])
              : 0;

          const forceNone =
            shouldForceToolChoiceNone(patchedMessages as any[], stopTools) ||
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
    [authFetch, applyOverrides, baseBody, maxToolCalls, stopTools]
  );

  const {
    messages,
    sendMessage,
    status,
    addToolOutput,
    stop,
    addToolApprovalResponse,
  } = useChat({
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

  const uiMessages = useMemo(() => {
    return (messages ?? [])
      .map((m) => {
        const ov = uiMessageOverrides[m.id];
        return ov === undefined ? (m as any as UIMessage) : ov;
      })
      .filter((m): m is UIMessage => !!m);
  }, [messages, uiMessageOverrides]);

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

        {debugMode ? <JsonViewer value={JSON.stringify(uiMessages)} />
          : <MessageList
            // NOTE: `useChat()` doesn't expose `setMessages` in this codebase,
            // so we keep a local overlay for edits/deletes.
            messages={uiMessages}
            sendMessage={async (msg: any) => {
              startRun()
              await handleSend(msg.prompt)
            }}
            showAttachments={setMessageAttachments}
            showCitations={setSources}
            showActivity={setMessageActivity}
            conversationId={conversationId}
            onUiMessagePatched={(uiMessageId, next) => {
              setUiMessageOverrides((prev) => ({
                ...prev,
                [uiMessageId]: (next as any as UIMessage) ?? null,
              }));
            }}
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

      <ActivityDrawer messages={uiMessages} uiTree={tree} />

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
        messages={uiMessages}
        tools={tools}
        status={status}
        addToolApprovalResponse={addToolApprovalResponse}

      />

      <ElicitationModalHost />
    </div>
  );
}
