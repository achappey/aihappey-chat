import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConversations } from "aihappey-conversations";
import { store, useAppStore } from "aihappey-state";
import { usesOpenAiLiveProtocol } from './liveSessionConfig';
import { LiveConversationRuntime } from './liveConversationRuntime';
import { runLiveClientDelegation } from './runLiveClientDelegation';
import { useRealtimeToolApprovals } from './useRealtimeToolApprovals';
import { RealtimeHistoryWriter } from './realtimeHistoryWriter';
import type { UIMessage } from "aihappey-types";
import type { ChatConfig } from "../chat/context/ChatContext";
import { useChatErrors } from "../chat/layout/useChatErrors";
import { useOnToolCall } from "../tools/toolcalls/useOnToolCall";
import { useTools } from "../tools/useTools";
import {
  buildRealtimeConversationSessionUpdateEvent,
  startRealtimeConversationProviderSession,
  type RealtimeConversationSession,
} from "./realtimeConversationProviders";
import {
  extractFunctionCallsFromRealtimeResponse,
  extractTextFromRealtimeResponse,
  newUiMessage,
  realtimeContentToText,
  uiMessageToRealtimeContent,
} from "./realtimeMessageParts";

type RealtimeStatus = "idle" | "starting" | "connected" | "stopping" | "error";

const describeError = (e: unknown) => {
  if (!e) return "unknown";
  if (e instanceof Error) return e.message || e.name;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
};

const safeJsonParse = (value: any) => {
  if (typeof value !== "string") return value ?? {};
  try {
    return JSON.parse(value);
  } catch {
    return { value };
  }
};

export function useRealtimeConversationController(args: {
  config: ChatConfig;
  conversationId: string;
  initialMessages: UIMessage[];
  model: string;
  instructions?: string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}) {
  const { config, conversationId, initialMessages, model, instructions, audioRef } = args;
  const { addMessage, updateMessage, refresh } = useConversations();
  const { addChatError } = useChatErrors();
  const customHeaders = useAppStore((s) => s.customHeaders);
  const providerRealtimeConversationMetadata = useAppStore((s) => s.providerRealtimeConversationMetadata);
  const providerMetadata = useAppStore((s) => s.providerMetadata);
  const maxOutputTokens = useAppStore((s) => s.maxOutputTokens);
  const toolChoice = useAppStore((s) => s.toolChoice);
  const callTool = useAppStore((s) => s.callTool);
  const { tools } = useTools();
  const approvals = useRealtimeToolApprovals();
  const models = useAppStore(s => s.models);
  const modelTags = useMemo(() => models?.find(m => m.id === model)?.tags ?? [], [models, model]);
  const isLive = model.startsWith('openai/') && usesOpenAiLiveProtocol(modelTags);
  const toolUse = useOnToolCall({
    api: config.baseUrl,
    getAccessToken: config.getAccessToken,
    conversationId,
    headers: config.headers,
    customFetch: config.fetch,
    callTool,
    tools,
    send: async () => {
      throw new Error("Realtime UI generation is not available during a live voice session.");
    },
  });

  const [status, setStatus] = useState<RealtimeStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraEnabled, setCameraEnabledState] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>(initialMessages ?? []);
  const [events, setEvents] = useState<any[]>([]);

  const sessionRef = useRef<RealtimeConversationSession | null>(null);
  const liveRef = useRef<LiveConversationRuntime | null>(null);
  const startupRef = useRef<AbortController | null>(null);
  const stoppingRef = useRef(false);
  const stopPromiseRef = useRef<Promise<void> | null>(null);
  const historyRef = useRef<RealtimeHistoryWriter | null>(null);
  if (!historyRef.current) historyRef.current = new RealtimeHistoryWriter({
    add: message => addMessage(conversationId, message),
    update: message => updateMessage(conversationId, message.id, message),
    error: error => addChatError(new Error(`Failed to save realtime message: ${describeError(error)}`)),
  });
  const startedRef = useRef(false);
  const pendingQueueRef = useRef<UIMessage[]>([]);
  const assistantDraftRef = useRef<UIMessage | null>(null);
  const assistantTextRef = useRef("");
  const userAudioDraftRef = useRef<UIMessage | null>(null);
  const userAudioTextByItemRef = useRef<Record<string, string>>({});
  const functionCallsInFlightRef = useRef<Set<string>>(new Set());
  const responseIdsPersistedRef = useRef<Set<string>>(new Set());
  const functionCallArgsRef = useRef<Record<string, any>>({});
  const functionCallsDoneRef = useRef<Set<string>>(new Set());
  const handledFunctionCallsRef = useRef<Set<string>>(new Set());
  const responseFunctionCallIdsRef = useRef<Record<string, Set<string>>>({});
  const functionCallResponseIdsRef = useRef<Record<string, string>>({});
  const functionCallOutputsSubmittedRef = useRef<Set<string>>(new Set());
  const responseFunctionCallsDoneRef = useRef<Set<string>>(new Set());
  const responseContinuationsCreatedRef = useRef<Set<string>>(new Set());
  const toolExecutionQueueRef = useRef<Promise<void>>(Promise.resolve());
  const assemblyAiToolResultsPendingReplyDoneRef = useRef<Array<{ callId: string; result: any }>>([]);
  const isAssemblyAiRealtime = model.toLowerCase().startsWith("assemblyai/");
  const isCartesiaRealtime = model.toLowerCase().startsWith("cartesia/agents/");
  const cartesiaTurnsRef = useRef<Map<number, UIMessage>>(new Map());
  const cartesiaToolExpectsResponseRef = useRef<Map<string, boolean>>(new Map());

  useEffect(() => {
    historyRef.current!.seed(initialMessages ?? []);
    setMessages(current => startedRef.current ? [...(initialMessages ?? []).filter(message => !current.some(existing => existing.id === message.id)), ...current] : initialMessages ?? []);
  }, [initialMessages]);

  const persistMessage = useCallback(
    async (message: UIMessage) => {
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === message.id);
        if (idx >= 0) {
          const next = prev.slice();
          next[idx] = message;
          return next;
        }
        return [...prev, message];
      });

      await historyRef.current!.save(message);
    },
    []
  );

  const upsertLocalDraft = useCallback((message: UIMessage | null) => {
    if (!message) return;
    historyRef.current!.remember(message);
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === message.id);
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = message;
        return next;
      }
      return [...prev, message];
    });
  }, []);

  const sendEvent = useCallback((event: any) => {
    sessionRef.current?.send(event);
  }, []);

  const getFunctionCallResponseId = useCallback((functionCall: any) => {
    const callId = String(functionCall?.call_id ?? functionCall?.callId ?? "");
    return String(
      functionCall?.response_id ??
      functionCall?.responseId ??
      (callId ? functionCallArgsRef.current[callId]?.response_id : undefined) ??
      (callId ? functionCallResponseIdsRef.current[callId] : undefined) ??
      ""
    );
  }, []);

  const registerFunctionCallForResponse = useCallback((functionCall: any, responseIdHint?: string) => {
    const callId = String(functionCall?.call_id ?? functionCall?.callId ?? "");
    if (!callId) return "";

    const responseId = String(responseIdHint ?? getFunctionCallResponseId(functionCall) ?? "");
    functionCallArgsRef.current[callId] = {
      ...functionCallArgsRef.current[callId],
      ...functionCall,
      ...(responseId ? { response_id: responseId } : {}),
    };

    if (responseId) {
      functionCallResponseIdsRef.current[callId] = responseId;
      responseFunctionCallIdsRef.current[responseId] ??= new Set<string>();
      responseFunctionCallIdsRef.current[responseId].add(callId);
    }

    return responseId;
  }, [getFunctionCallResponseId]);

  const cleanupCompletedResponseFunctionCalls = useCallback((responseId: string) => {
    const callIds = responseFunctionCallIdsRef.current[responseId];
    if (callIds) {
      for (const callId of callIds) {
        functionCallsDoneRef.current.delete(callId);
        functionCallsInFlightRef.current.delete(callId);
        functionCallOutputsSubmittedRef.current.delete(callId);
        delete functionCallResponseIdsRef.current[callId];
        delete functionCallArgsRef.current[callId];
      }
    }

    delete responseFunctionCallIdsRef.current[responseId];
    responseFunctionCallsDoneRef.current.delete(responseId);
  }, []);

  const maybeCreateContinuationForResponse = useCallback((responseId: string) => {
    if (!responseId) return;
    if (!responseFunctionCallsDoneRef.current.has(responseId)) return;
    if (responseContinuationsCreatedRef.current.has(responseId)) return;

    const callIds = Array.from(responseFunctionCallIdsRef.current[responseId] ?? []);
    if (callIds.length === 0) return;
    if (!callIds.every((callId) => functionCallOutputsSubmittedRef.current.has(callId))) return;

    responseContinuationsCreatedRef.current.add(responseId);
    cleanupCompletedResponseFunctionCalls(responseId);
    sendEvent({ type: "response.create" });
  }, [cleanupCompletedResponseFunctionCalls, sendEvent]);

  const submitAssemblyAiPendingToolResults = useCallback(() => {
    const pending = assemblyAiToolResultsPendingReplyDoneRef.current.splice(0);
    for (const item of pending) {
      sendEvent({
        type: "tool.result",
        call_id: item.callId,
        result: JSON.stringify(item.result),
      });
    }
  }, [sendEvent]);

  const submitFunctionCallOutput = useCallback((callId: string, result: any) => {
    if (isCartesiaRealtime) {
      if (cartesiaToolExpectsResponseRef.current.get(callId)) {
        let output = JSON.stringify(result);
        if (new TextEncoder().encode(output).length > 4096) output = "Tool result exceeds Cartesia's 4096-byte limit.";
        sendEvent({ type: "client_tool_result", tool_call_id: callId, result: output, is_error: !!result?.isError });
      }
      cartesiaToolExpectsResponseRef.current.delete(callId);
      return;
    }
    if (isAssemblyAiRealtime) {
      assemblyAiToolResultsPendingReplyDoneRef.current.push({ callId, result });
      return;
    }

    sendEvent({
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: callId,
        name: functionCallArgsRef.current[callId]?.name,
        output: JSON.stringify(result),
      },
    });

    functionCallOutputsSubmittedRef.current.add(callId);
    maybeCreateContinuationForResponse(functionCallResponseIdsRef.current[callId] ?? "");
  }, [isAssemblyAiRealtime, isCartesiaRealtime, maybeCreateContinuationForResponse, sendEvent]);

  const runToolCallSequentially = useCallback(<T,>(run: () => Promise<T>) => {
    const resultPromise = toolExecutionQueueRef.current
      .catch(() => undefined)
      .then(run);

    toolExecutionQueueRef.current = resultPromise.then(
      () => undefined,
      () => undefined
    );

    return resultPromise;
  }, []);

  const executeFunctionCall = useCallback(
    async (functionCall: any) => {
      const callId = String(functionCall.call_id ?? "");
      registerFunctionCallForResponse(functionCall);
      const name = String(functionCall.name ?? functionCallArgsRef.current[callId]?.name ?? "");
      if (!callId || !name || functionCallsInFlightRef.current.has(callId)) return;
      handledFunctionCallsRef.current.add(callId);
      functionCallsInFlightRef.current.add(callId);

      const input = safeJsonParse(functionCall.arguments ?? functionCallArgsRef.current[callId]?.arguments ?? {});
      const toolMessage = newUiMessage("assistant", [
        {
          type: `tool-${name}`,
          toolCallId: callId,
          toolName: name,
          state: "input-available",
          input,
        },
      ], { realtime: true, model });
      upsertLocalDraft(toolMessage);

      let result: any;
      try {
        result = await runToolCallSequentially(() =>
          (toolUse.onToolCall as any)({
            toolCall: {
              toolCallId: callId,
              toolName: name,
              input,
            },
          })
        );
      } catch (e) {
        const message = describeError(e);
        addChatError(new Error(`Realtime tool call failed: ${message}`));
        result = {
          isError: true,
          content: [{ type: "text", text: message }],
        };
      }

      const completedToolMessage: UIMessage = {
        ...toolMessage,
        parts: [
          {
            type: `tool-${name}`,
            toolCallId: callId,
            toolName: name,
            state: "output-available",
            input,
            output: result,
          },
        ],
      };
      await persistMessage(completedToolMessage);

      submitFunctionCallOutput(callId, result);
    },
    [addChatError, model, persistMessage, registerFunctionCallForResponse, runToolCallSequentially, submitFunctionCallOutput, toolUse.onToolCall, upsertLocalDraft]
  );

  const configureSession = useCallback(() => {
    const event = buildRealtimeConversationSessionUpdateEvent({
      model,
      modelTags,
      providerMetadata,
      providerRealtimeConversationMetadata,
      instructions,
      maxOutputTokens,
      tools,
      toolChoice,
    });
    if (event) sendEvent(event);
  }, [instructions, maxOutputTokens, model, modelTags, providerMetadata, providerRealtimeConversationMetadata, sendEvent, toolChoice, tools]);

  const flushPendingQueue = useCallback(() => {
    if (isCartesiaRealtime) { pendingQueueRef.current = []; return; }
    const pending = pendingQueueRef.current.splice(0);
    for (const message of pending) {
      if (liveRef.current) { liveRef.current.sendMessage(message); continue; }
      const content = uiMessageToRealtimeContent(message);
      if (content.length === 0) continue;
      sendEvent({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content,
        },
      });
      sendEvent({ type: "response.create" });
    }
  }, [isCartesiaRealtime, sendEvent]);

  const handleRealtimeEvent = useCallback(
    (event: any) => {
      setEvents((prev) => [event, ...prev].slice(0, 60));
      const type = String(event?.type ?? "");
      if (liveRef.current) { liveRef.current.handle(event); return; }

      if (isCartesiaRealtime) {
        if (type === "error") {
          const message = String(event.message ?? event.code ?? "Cartesia agent error");
          setError(message);
          addChatError(new Error(message));
          return;
        }
        if (type === "client_tool_call") {
          const id = String(event.tool_call_id ?? "");
          if (id) {
            cartesiaToolExpectsResponseRef.current.set(id, event.expects_response === true);
            void executeFunctionCall({ call_id: id, name: event.tool_name, arguments: event.parameters });
          }
          return;
        }
        if (type === "turn_started" && Number.isInteger(event.turn)) {
          const role = event.role === "user" ? "user" : "assistant";
          const draft = newUiMessage(role, [{ type: "text", text: role === "user" ? "Listening…" : "Speaking…" }], { realtime: true, model, turn: event.turn });
          cartesiaTurnsRef.current.set(event.turn, draft);
          upsertLocalDraft(draft);
          return;
        }
        if (type === "turn_output_text_delta" && Number.isInteger(event.turn)) {
          const draft = cartesiaTurnsRef.current.get(event.turn) ?? newUiMessage("assistant", [], { realtime: true, model });
          const previous = String((draft.parts[0] as any)?.text ?? "");
          const next = { ...draft, parts: [{ type: "text", text: previous === "Speaking…" ? event.text : previous + String(event.text ?? "") }] };
          cartesiaTurnsRef.current.set(event.turn, next);
          upsertLocalDraft(next);
          return;
        }
        if (type === "turn_ended" && Number.isInteger(event.turn)) {
          const draft = cartesiaTurnsRef.current.get(event.turn) ?? newUiMessage(event.role === "user" ? "user" : "assistant", [], { realtime: true, model });
          cartesiaTurnsRef.current.delete(event.turn);
          void persistMessage({ ...draft, parts: [{ type: "text", text: String(event.text ?? "") }], metadata: { ...draft.metadata, model, realtime: true, turn: event.turn, interrupted: event.interrupted, start_time: event.start_time, end_time: event.end_time, tool_calls: event.tool_calls } });
          return;
        }
        return; // Unknown Cartesia telemetry must not be interpreted as OpenAI protocol.
      }

      if (type === "error") {
        const message = event?.error?.message ?? event?.message ?? "Realtime session error";
        setError(String(message));
        addChatError(new Error(String(message)));
        return;
      }

      if (type === "session.error") {
        const message = event?.message ?? event?.code ?? "Realtime session error";
        setError(String(message));
        addChatError(new Error(String(message)));
        return;
      }

      if (type === "transcript.user.delta") {
        const itemId = String(event?.item_id ?? "assemblyai-user-voice");
        const next = String(event?.text ?? "");
        userAudioTextByItemRef.current[itemId] = next;
        const draft = userAudioDraftRef.current ?? newUiMessage("user", [], { realtime: true, input: "audio", model });
        userAudioDraftRef.current = {
          ...draft,
          parts: [{ type: "text", text: next || "Listening…" }],
        };
        upsertLocalDraft(userAudioDraftRef.current);
        return;
      }

      if (type === "transcript.user") {
        const transcript = String(event?.text ?? "").trim();
        if (transcript) {
          const message = userAudioDraftRef.current ?? newUiMessage("user", [], { realtime: true, input: "audio", model });
          userAudioDraftRef.current = null;
          void persistMessage({
            ...message,
            parts: [{ type: "text", text: transcript }],
            metadata: {
              ...(message.metadata ?? {}),
              model,
              realtime: true,
              item_id: event?.item_id,
            },
          });
        }
        return;
      }

      if (type === "transcript.agent") {
        const text = String(event?.text ?? "").trim();
        if (text) {
          const message = assistantDraftRef.current ?? newUiMessage("assistant", [], { realtime: true, model });
          assistantDraftRef.current = null;
          assistantTextRef.current = "";
          void persistMessage({
            ...message,
            parts: [{ type: "text", text }],
            metadata: {
              ...(message.metadata ?? {}),
              model,
              realtime: true,
              reply_id: event?.reply_id,
              item_id: event?.item_id,
              interrupted: event?.interrupted,
            },
          });
        }
        return;
      }

      if (type === "transcript.agent.delta") {
        // Atoms deltas are cumulative snapshots, not incremental strings.
        assistantTextRef.current = String(event?.text ?? "");
        const draft = assistantDraftRef.current ?? newUiMessage("assistant", [], { realtime: true, model });
        assistantDraftRef.current = { ...draft, parts: [{ type: "text", text: assistantTextRef.current }] };
        upsertLocalDraft(assistantDraftRef.current);
        return;
      }

      if (type === "smallestai.session.closed") {
        const session = sessionRef.current; sessionRef.current = null;
        void session?.stop();
        startedRef.current = false;
        setStatus("idle");
        void historyRef.current!.flush().then(() => refresh()).catch(error => addChatError(error));
        return;
      }

      if (type === "tool.call") {
        const callId = String(event?.call_id ?? "");
        if (callId) {
          functionCallArgsRef.current[callId] = {
            ...functionCallArgsRef.current[callId],
            ...event,
            arguments: event?.arguments ?? {},
          };
        }
        void executeFunctionCall(event);
        return;
      }

      if (type === "reply.done") {
        submitAssemblyAiPendingToolResults();
        return;
      }

      if (type === "response.function_call_arguments.delta" && event?.call_id) {
        const callId = String(event.call_id);
        const existing = functionCallArgsRef.current[callId]?.arguments ?? "";
        functionCallArgsRef.current[callId] = {
          ...functionCallArgsRef.current[callId],
          name: event.name ?? functionCallArgsRef.current[callId]?.name,
          response_id: event.response_id ?? functionCallArgsRef.current[callId]?.response_id,
          arguments: existing + String(event.delta ?? ""),
        };
        registerFunctionCallForResponse({ call_id: callId, response_id: event.response_id });
        return;
      }

      if (type === "response.function_call_arguments.done" && event?.call_id) {
        const callId = String(event.call_id);
        functionCallArgsRef.current[callId] = {
          ...functionCallArgsRef.current[callId],
          name: event.name ?? functionCallArgsRef.current[callId]?.name,
          response_id: event.response_id ?? functionCallArgsRef.current[callId]?.response_id,
          arguments: event.arguments ?? functionCallArgsRef.current[callId]?.arguments,
        };
        registerFunctionCallForResponse({ call_id: callId, response_id: event.response_id });
        functionCallsDoneRef.current.add(callId);
        return;
      }

      if (type === "conversation.item.input_audio_transcription.delta") {
        const itemId = String(event?.item_id ?? "voice");
        const next = `${userAudioTextByItemRef.current[itemId] ?? ""}${String(event?.delta ?? "")}`;
        userAudioTextByItemRef.current[itemId] = next;
        const draft = userAudioDraftRef.current ?? newUiMessage("user", [], { realtime: true, input: "audio", model });
        userAudioDraftRef.current = {
          ...draft,
          parts: [{ type: "text", text: next || "Listening…" }],
        };
        upsertLocalDraft(userAudioDraftRef.current);
        return;
      }

      if (type === "conversation.item.input_audio_transcription.completed") {
        const transcript = String(event?.transcript ?? "").trim();
        if (transcript) {
          const message = userAudioDraftRef.current ?? newUiMessage("user", [], { realtime: true, input: "audio", model });
          userAudioDraftRef.current = null;
          void persistMessage({
            ...message,
            parts: [{ type: "text", text: transcript }],
          });
        }
        return;
      }

      if (
        type === "response.output_audio_transcript.delta" ||
        type === "response.output_text.delta" ||
        type === "response.text.delta"
      ) {
        const delta = String(event?.delta ?? "");
        if (!delta) return;
        assistantTextRef.current += delta;
        const draft = assistantDraftRef.current ?? newUiMessage("assistant", [], { realtime: true, model });
        assistantDraftRef.current = {
          ...draft,
          parts: [{ type: "text", text: assistantTextRef.current }],
        };
        upsertLocalDraft(assistantDraftRef.current);
        return;
      }

      if (type.includes("reasoning") && typeof event?.delta === "string") {
        const draft = assistantDraftRef.current ?? newUiMessage("assistant", [], { realtime: true, model });
        const previous = String((draft.parts ?? []).find((p: any) => p?.type === "reasoning")?.text ?? "");
        assistantDraftRef.current = {
          ...draft,
          parts: [
            { type: "reasoning", text: previous + event.delta },
            ...(draft.parts ?? []).filter((p: any) => p?.type !== "reasoning"),
          ],
        };
        upsertLocalDraft(assistantDraftRef.current);
        return;
      }

      if (type === "response.output_item.done" && event?.item?.type === "function_call") {
        const callId = String(event.item?.call_id ?? "");
        if (callId) {
          functionCallArgsRef.current[callId] = {
            ...functionCallArgsRef.current[callId],
            ...event.item,
            response_id: event.response_id ?? functionCallArgsRef.current[callId]?.response_id,
          };
          registerFunctionCallForResponse({ ...event.item, response_id: event.response_id });
          functionCallsDoneRef.current.add(callId);
        }
        void executeFunctionCall(event.item);
        return;
      }

      if (type === "response.done") {
        const responseId = String(event?.response?.id ?? event?.event_id ?? crypto.randomUUID());
        if (!responseIdsPersistedRef.current.has(responseId)) {
          responseIdsPersistedRef.current.add(responseId);
          const text = extractTextFromRealtimeResponse(event?.response) || assistantTextRef.current.trim();
          if (text) {
            const message = assistantDraftRef.current ?? newUiMessage("assistant", [], { realtime: true, model });
            assistantDraftRef.current = null;
            assistantTextRef.current = "";
            void persistMessage({
              ...message,
              parts: [{ type: "text", text }],
              metadata: {
                ...(message.metadata ?? {}),
                model,
                realtime: true,
                response: event.response,
              },
            });
          }
        }

        const functionCalls = extractFunctionCallsFromRealtimeResponse(event?.response);
        for (const functionCall of functionCalls) {
          registerFunctionCallForResponse(functionCall, responseId);
          void executeFunctionCall({ ...functionCall, response_id: responseId });
        }
        for (const callId of Array.from(functionCallsDoneRef.current)) {
          if (handledFunctionCallsRef.current.has(callId)) continue;
          const functionCall = functionCallArgsRef.current[callId];
          const callResponseId = getFunctionCallResponseId({ ...functionCall, call_id: callId });
          if (callResponseId && callResponseId !== responseId) continue;
          if (functionCall?.name) {
            registerFunctionCallForResponse({ ...functionCall, call_id: callId }, responseId);
            void executeFunctionCall({ ...functionCall, call_id: callId, response_id: responseId });
          }
        }
        if ((responseFunctionCallIdsRef.current[responseId]?.size ?? 0) > 0) {
          responseFunctionCallsDoneRef.current.add(responseId);
          maybeCreateContinuationForResponse(responseId);
        }
      }
    },
    [addChatError, executeFunctionCall, getFunctionCallResponseId, maybeCreateContinuationForResponse, isCartesiaRealtime, model, persistMessage, registerFunctionCallForResponse, submitAssemblyAiPendingToolResults, upsertLocalDraft]
  );

  const start = useCallback(
    async (initialMessage?: UIMessage) => {
      if (startedRef.current || sessionRef.current || status === "starting" || !model) return;
      if (isCartesiaRealtime && initialMessage) throw new Error("Cartesia agents accept audio only; remove the initial text message.");
      startedRef.current = true;
      stoppingRef.current = false; stopPromiseRef.current = null;
      setStatus("starting");
      setError(null);
      if (initialMessage) {
        const persisted: UIMessage = {
          ...initialMessage,
          metadata: {
            ...(initialMessage.metadata ?? {}),
            realtime: true,
            model,
          },
        };
        await persistMessage(persisted);
        if (!isCartesiaRealtime) pendingQueueRef.current.push(persisted);
      }

      try {
        const startup = new AbortController(); startupRef.current = startup;
        if (isLive) {
          const executeTool = async (item: any, signal: AbortSignal) => {
            signal.throwIfAborted();
            if (!['function_call', 'custom_tool_call'].includes(item.type)) throw new Error(`No authorized client executor for ${item.type}.`);
            if (!tools.some(tool => tool.name === item.name)) throw new Error(`Tool '${item.name}' is not enabled in this client.`);
            const result = await (toolUse.onToolCall as any)({ toolCall: { toolCallId: item.call_id, toolName: item.name, input: item.type === 'function_call' ? JSON.parse(item.arguments) : item.input }, signal });
            signal.throwIfAborted();
            return result;
          };
          const execute = async (item: any, signal: AbortSignal) => {
            if (item.type === 'mcp_approval_request') {
              const decision = await approvals.review({ toolCallId: item.id, toolName: item.name ?? item.server_label ?? 'MCP', input: item.arguments }, signal);
              return { type: 'mcp_approval_response', approval_request_id: item.id, approve: decision.approved, ...(decision.reason ? { reason: decision.reason } : {}) };
            }
            const result = await executeTool(item, signal);
            const input = item.type === 'function_call' ? JSON.parse(item.arguments) : item.input;
            const message = newUiMessage('assistant', [{ type: `tool-${item.name}`, toolCallId: item.call_id, state: 'approval-requested', input, output: result, approval: { id: crypto.randomUUID() } }], { realtime: true, model });
            await persistMessage(message);
            const decision = await approvals.review({ toolCallId: item.call_id, toolName: item.name, input, output: result }, signal);
            signal.throwIfAborted();
            await persistMessage({ ...message, parts: message.parts.map((part: any) => ({ ...part, state: 'approval-responded', approval: { ...part.approval, ...decision } })) });
            return { type: item.type === 'function_call' ? 'function_call_output' : 'custom_tool_call_output', call_id: item.call_id,
              output: JSON.stringify(decision.approved ? result : { isError: true, content: [{ type: 'text', text: decision.reason ?? 'Tool result was not approved.' }] }), ...(item.caller ? { caller: item.caller } : {}) };
          };
          liveRef.current = new LiveConversationRuntime({ send: sendEvent,
            message: message => { void persistMessage({ ...message, metadata: { ...message.metadata, model, realtime: true } }); },
            error: message => { if (!stoppingRef.current) addChatError(new Error(message)); }, execute,
            runClient: (messages, signal) => runLiveClientDelegation({ config, state: { ...store.getState(), tools }, messages, signal, execute: executeTool, review: approvals.review,
              onMessage: message => persistMessage({ ...message, metadata: { ...message.metadata, realtime: true, backend: true } }),
            }),
            closed: event => {
              const last = historyRef.current!.lastAssistant();
              if (last) void persistMessage({ ...last, metadata: { ...last.metadata, liveSession: event.session?.id, liveUsage: event.usage, closeReason: event.reason } });
              if (!stoppingRef.current) {
                stoppingRef.current = true; approvals.cancel();
                const session = sessionRef.current; sessionRef.current = null;
                void (async () => { await session?.stop(); await historyRef.current!.flush(); await refresh(); })().catch(error => addChatError(error));
                startedRef.current = false; setStatus('idle');
              }
            },
          }, providerRealtimeConversationMetadata?.openai?.session?.delegation?.type === 'responses' ? 'responses' : 'client', initialMessages);
        }
        const session = await startRealtimeConversationProviderSession({
          config,
          customHeaders,
          model,
          modelTags,
          abortSignal: startup.signal,
          providerMetadata,
          providerRealtimeConversationMetadata,
          instructions,
          maxOutputTokens,
          tools,
          toolChoice,
          events: {
            onRemoteStream: (stream: MediaStream) => {
              if (audioRef.current) {
                audioRef.current.srcObject = stream;
                audioRef.current.autoplay = true;
              }
            },
            onOpen: () => {
              setStatus("connected");
              configureSession();
              flushPendingQueue();
            },
            onEvent: handleRealtimeEvent,
            onError: (message: string, err?: unknown) => {
              if (stoppingRef.current) return;
              const full = `${message}${err ? `: ${describeError(err)}` : ""}`;
              setStatus("error");
              setError(full);
              addChatError(new Error(full));
            },
          },
        });

        sessionRef.current = session;
        if (startup.signal.aborted) { await session.stop(); sessionRef.current = null; return; }
        session.setMicrophoneEnabled(!muted);
        if (model.startsWith("smallestai/")) {
          // Atoms session.created arrives before its startup promise returns.
          setStatus("connected");
          flushPendingQueue();
        }
      } catch (e) {
        liveRef.current?.stop(); liveRef.current = null;
        const full = describeError(e);
        setStatus("error");
        setError(full);
        setCameraEnabledState(false);
        setCameraStream(null);
        addChatError(new Error(full));
        startedRef.current = false;
      }
    },
    [addChatError, audioRef, config, configureSession, customHeaders, isCartesiaRealtime,
      flushPendingQueue, handleRealtimeEvent, maxOutputTokens, model,
      muted, providerMetadata, providerRealtimeConversationMetadata, status, toolChoice, tools, instructions,
      isLive, modelTags, initialMessages, persistMessage, sendEvent, toolUse.onToolCall, upsertLocalDraft, approvals.review]
  );

  const stop = useCallback(() => {
    if (stopPromiseRef.current) return stopPromiseRef.current;
    stoppingRef.current = true; approvals.cancel(); liveRef.current?.beginClose();
    const session = sessionRef.current; sessionRef.current = null;
    if (!session) startupRef.current?.abort();
    setStatus('stopping'); setCameraEnabledState(false); setCameraStream(null);
    const stopping = (async () => {
      try {
        await session?.stop();
        liveRef.current?.stop(); liveRef.current = null;
        if (assistantDraftRef.current) await persistMessage(assistantDraftRef.current);
        if (userAudioDraftRef.current) await persistMessage(userAudioDraftRef.current);
        await historyRef.current!.flush();
        await refresh();
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.srcObject = null; }
        setError(null);
      } finally { startedRef.current = false; setStatus('idle'); }
    })();
    stopPromiseRef.current = stopping;
    // Retain failed snapshots and allow another Stop to retry storage, not inference.
    void stopping.catch(() => { stopPromiseRef.current = null; });
    return stopping;
  }, [approvals.cancel, audioRef, persistMessage, refresh]);

  const setMicrophoneMuted = useCallback((nextMuted: boolean) => {
    setMuted(nextMuted);
    sessionRef.current?.setMicrophoneEnabled(!nextMuted);
  }, []);

  const setCameraEnabled = useCallback(async (enabled: boolean) => {
    const session = sessionRef.current;
    if (!session?.setCameraEnabled) return;
    if (!enabled) {
      setCameraEnabledState(false);
      setCameraStream(null);
    }
    try {
      await session.setCameraEnabled(enabled);
      const isEnabled = session.cameraEnabled ?? enabled;
      setCameraEnabledState(isEnabled);
      setCameraStream(isEnabled ? (session.localCameraStream ?? null) : null);
    } catch (e) {
      if (enabled) {
        setCameraEnabledState(false);
        setCameraStream(null);
      }
      const message = `Failed to ${enabled ? "start" : "stop"} camera: ${describeError(e)}`;
      setError(message);
      addChatError(new Error(message));
    }
  }, [addChatError]);

  const sendMessage = useCallback(
    async (message: UIMessage) => {
      if (isCartesiaRealtime) throw new Error("Cartesia agents do not support text input.");
      const content = uiMessageToRealtimeContent(message);
      if (content.length === 0) return;

      const persisted: UIMessage = {
        ...message,
        metadata: {
          ...(message.metadata ?? {}),
          realtime: true,
          model,
          realtimeText: realtimeContentToText(content),
        },
      };
      await persistMessage(persisted);

      if (!sessionRef.current || status !== "connected") {
        pendingQueueRef.current.push(persisted);
    if (status === "idle" || status === "error") void start();
        return;
      }

      if (liveRef.current) { liveRef.current.sendMessage(persisted); return; }
      sendEvent({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content,
        },
      });
      sendEvent({ type: "response.create" });
    },
    [isCartesiaRealtime, model, persistMessage, sendEvent, start, status]
  );

  const sendDtmf = useCallback((digit: string) => {
    if (!isCartesiaRealtime || !/^[0-9*#]$/.test(digit)) throw new Error("Invalid Cartesia DTMF digit");
    sendEvent({ type: "dtmf_input", digit });
  }, [isCartesiaRealtime, sendEvent]);

  useEffect(() => {
    return () => {
      void stop().catch(error => addChatError(error));
    };
  }, [stop, addChatError]);

  return useMemo(
    () => ({
      status,
      approvalMessages: approvals.messages,
      respondToToolApproval: approvals.respond,
      sendDtmf,
      error,
      muted,
      cameraEnabled,
      cameraStream,
      cameraSupported: model.toLowerCase().startsWith("google/"),
      messages,
      events,
      tools,
      start,
      stop,
      setMicrophoneMuted,
      setCameraEnabled,
      sendMessage,
    }),
    [cameraEnabled, cameraStream, error, events, messages, model, muted, sendDtmf, sendMessage, setCameraEnabled, setMicrophoneMuted, start, status, stop, tools, approvals.messages, approvals.respond]
  );
}

