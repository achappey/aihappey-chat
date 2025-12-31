import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses, SourceUrlUIPart, useChat } from "aihappey-ai";
import { useConversations } from "aihappey-conversations";
import { useAppStore } from "aihappey-state";
import { useMemo, useState, useRef, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { useTheme } from "aihappey-components";
import { SimpleActivityDrawer } from "../activity/drawer/SimpleActivityDrawer";
import { MessageInput } from "../input/MessageInput";
import { useAttachmentParts } from "../messages/useAttachmentParts";
import { useChatFileDrop } from "../input/useChatFileDrop";
import { useOnToolCall } from "../../tools/toolcalls/useOnToolCall";
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
import { useAuthFetch } from "./useAuthFetch";
import { usePendingMessageAutoSend } from "./usePendingMessageAutoSend";
import { useAbortRun } from "./useAbortRun";
import { useApiRef } from "./useApiRef";
import { ElicitationModalHost } from "../../elicitation/ElicitationModalHost";
import { ToolApprovalModalHost } from "../../tools/ToolApprovalModalHost";
import { sendAutomaticallyWhen } from "./sendAutomaticallyWhen";
import { toolApprovalGate } from "./toolApprovalGate";

function lastAssistantMessageIsCompleteWithApprovalResponsesLoose(options: any) {
  const messages = (options?.messages ?? []) as any[];

  // Scan from newest -> oldest for the most recent assistant message that has approval-requested tool parts
  for (let ai = messages.length - 1; ai >= 0; ai--) {
    const m = messages[ai];
    if (m?.role !== "assistant") continue;

    const approvalIds = (m.parts ?? [])
      .filter((p: any) =>
        typeof p?.type === "string" &&
        p.type.startsWith("tool-") &&
        p.state === "approval-requested" &&
        p.approval?.id
      )
      .map((p: any) => p.approval.id);

    if (approvalIds.length === 0) continue;

    // Collect ALL approval responses that appear AFTER that assistant message (not only the next message)
    const responded = new Set<string>();
    for (let j = ai + 1; j < messages.length; j++) {
      for (const p of (messages[j]?.parts ?? [])) {
        if (p?.type === "tool-approval-response") {
          responded.add(p.approvalId ?? p.id); // support either shape
        }
      }
    }

    return approvalIds.every((id: string) => responded.has(id));
  }

  return false;
}


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
  const { addChatError } = useChatErrors();
  const [sources, setSources] = useState<(SourceUrlUIPart)[] | undefined>(undefined);
  const [messageActivity, setMessageActivity] = useState<any[] | undefined>(undefined);
  const [showToolCall, setShowToolCall] = useState<any | undefined>(undefined);
  const [messageAttachments, setMessageAttachments] = useState<any[] | undefined>(undefined);
  const [usedTools, setUsedTool] = useState<any[] | undefined>(undefined);
  const { addMessage, rename, updateMessage, get } = useConversations();
  const experimentalThrottle = useAppStore((s) => s.experimentalThrottle);
  const customHeaders = useAppStore((s) => s.customHeaders);
  const navigate = useNavigate();
  const debugMode = useAppStore((a) => a.debugMode);
  const chatMode = useAppStore((a) => a.chatMode);
  const callTool = useAppStore((a) => a.callTool);
  const providerMetadata = useActiveProviderMetadata();
  const model = useAppStore((s) => s.selectedModel);
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

  const authFetch = useAuthFetch({
    chatMode,
    getAccessToken,
    refreshToken,
    headers,
    customHeaders,
    customFetch,
  });


  const api = chatMode === "agent"
    ? config?.agentEndpoint + "/api/chat"
    : config?.api || "/api/chat";

  const toolUse = useOnToolCall({
    api,
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
        prepareSendMessagesRequest: (opts) => ({
          // force the CURRENT endpoint at request time:
          headers: opts.headers,
          credentials: opts.credentials,
          body: {
            ...baseBody,              // ✅ always present (model included)
            ...(opts.body ?? {}),     // per-call overrides/additions
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
  //const approveAll = useAppStore((a) => a.approveAll);
  //const allowedToolList = useAppStore((a) => a.allowedToolList);

  //const shouldAutoApproveTool = (toolName: string) =>
//    approveAll || allowedToolList.includes(toolName);

  const { messages, sendMessage, status, addToolOutput, stop, addToolApprovalResponse } = useChat({
    id: conversationId,
    transport,
    experimental_throttle: experimentalThrottle,
    onError: addChatError,

    /*  onToolCall: async ({ toolCall }) => {
        const toolCallId = toolCall.toolCallId;
        const toolName = toolCall.toolName;
  
        // ⛔ wacht op approval als niet auto-approved
        if (!shouldAutoApproveTool(toolName)) {
          const decision = await toolApprovalGate.wait(toolCallId, abortRef.current?.signal);
  
          if (!decision.approved) {
            const denied = { ok: false, denied: true, reason: decision.reason ?? "User denied" };
  
            addToolOutput({ tool: toolName, toolCallId, output: denied });
            return denied;
          }
        }
  
        // ✅ approved: voer tool uit en return output
        const result = await (toolUse.onToolCall as any)({
          toolCall,
          signal: abortRef.current?.signal,
        });
  
        addToolOutput({ tool: toolName, toolCallId, output: result });
        return result;
      },*/
    /*   onToolCall: async ({ toolCall }) => {
         // probeer approvalId te vinden bij dit toolCallId
         const approvalId = (() => {
           const msgs = messagesRef.current as any[];
           for (let mi = msgs.length - 1; mi >= 0; mi--) {
             const m = msgs[mi];
             if (m?.role !== "assistant") continue;
             for (const p of (m.parts ?? [])) {
               if (
                 p?.toolCallId === toolCall.toolCallId &&
                 typeof p?.type === "string" &&
                 p.type.startsWith("tool-") &&
                 p.state === "approval-requested" &&
                 p.approval?.id
               ) {
                 return p.approval.id as string;
               }
             }
           }
           return undefined;
         })();
   
         if (approvalId) {
           // ⛔ wacht op user decision (approve/deny)
           const decision = await toolApprovalGate.wait(approvalId, abortRef.current?.signal);
   
           if (!decision.approved) {
             const denied = { ok: false, denied: true, reason: decision.reason ?? "User denied" };
   
             addToolOutput({
               tool: toolCall.toolName,
               toolCallId: toolCall.toolCallId,
               output: denied,
             });
   
             // return tool output (zodat de LLM kan doorpraten)
             return denied;
           }
         }
   
         // ✅ approved (of geen approval nodig): execute normaal
         const result = await (toolUse.onToolCall as any)({
           toolCall,
           signal: abortRef.current?.signal,
         });
   
         addToolOutput({
           tool: toolCall.toolName,
           toolCallId: toolCall.toolCallId,
           output: result,
         });
   
         return result;
       },
   */

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

  // keep latest messages for lookup inside onToolCall
  const messagesRef = useRef<UIMessage[]>(seededMessages);
  useEffect(() => {
    messagesRef.current = messages as any;
  }, [messages]);
  /*
    const addToolApprovalResponseWithGate = (x: { id: string; approved: boolean; reason?: string }) => {
      // id == toolCallId
      toolApprovalGate.resolve(x.id, { approved: x.approved, reason: x.reason });
      addToolApprovalResponse(x);
    };*/


  const { abortRef, startRun, cancelRun } = useAbortRun(stop);

  const getAttachmentParts = useAttachmentParts();

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