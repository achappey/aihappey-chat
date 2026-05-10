import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConversations } from "aihappey-conversations";
import { useAppStore } from "aihappey-state";
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
  const toolUse = useOnToolCall({
    api: config.baseUrl,
    getAccessToken: config.getAccessToken,
    conversationId,
    headers: config.headers,
    customFetch: config.fetch,
    callTool,
    send: async () => {
      throw new Error("Realtime UI generation is not available during a live voice session.");
    },
  });

  const [status, setStatus] = useState<RealtimeStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>(initialMessages ?? []);
  const [events, setEvents] = useState<any[]>([]);

  const sessionRef = useRef<RealtimeConversationSession | null>(null);
  const startedRef = useRef(false);
  const pendingQueueRef = useRef<UIMessage[]>([]);
  const persistedIdsRef = useRef<Set<string>>(new Set((initialMessages ?? []).map((m) => m.id)));
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

  useEffect(() => {
    setMessages(initialMessages ?? []);
    persistedIdsRef.current = new Set((initialMessages ?? []).map((m) => m.id));
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

      try {
        if (persistedIdsRef.current.has(message.id)) {
          await updateMessage(conversationId, message.id, message);
        } else {
          persistedIdsRef.current.add(message.id);
          await addMessage(conversationId, message);
        }
        refresh();
      } catch (e) {
        addChatError(new Error(`Failed to save realtime message: ${describeError(e)}`));
      }
    },
    [addChatError, addMessage, conversationId, refresh, updateMessage]
  );

  const upsertLocalDraft = useCallback((message: UIMessage | null) => {
    if (!message) return;
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

  const submitFunctionCallOutput = useCallback((callId: string, result: any) => {
    sendEvent({
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: callId,
        output: JSON.stringify(result),
      },
    });

    functionCallOutputsSubmittedRef.current.add(callId);
    maybeCreateContinuationForResponse(functionCallResponseIdsRef.current[callId] ?? "");
  }, [maybeCreateContinuationForResponse, sendEvent]);

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
      providerMetadata,
      providerRealtimeConversationMetadata,
      instructions,
      maxOutputTokens,
      tools,
      toolChoice,
    });
    if (event) sendEvent(event);
  }, [instructions, maxOutputTokens, model, providerMetadata, providerRealtimeConversationMetadata, sendEvent, toolChoice, tools]);

  const flushPendingQueue = useCallback(() => {
    const pending = pendingQueueRef.current.splice(0);
    for (const message of pending) {
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
  }, [sendEvent]);

  const handleRealtimeEvent = useCallback(
    (event: any) => {
      setEvents((prev) => [event, ...prev].slice(0, 60));
      const type = String(event?.type ?? "");

      if (type === "error") {
        const message = event?.error?.message ?? event?.message ?? "Realtime session error";
        setError(String(message));
        addChatError(new Error(String(message)));
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
    [addChatError, executeFunctionCall, getFunctionCallResponseId, maybeCreateContinuationForResponse, model, persistMessage, registerFunctionCallForResponse, upsertLocalDraft]
  );

  const start = useCallback(
    async (initialMessage?: UIMessage) => {
      if (startedRef.current || sessionRef.current || status === "starting" || !model) return;
      startedRef.current = true;
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
        pendingQueueRef.current.push(persisted);
      }

      try {
        const session = await startRealtimeConversationProviderSession({
          config,
          customHeaders,
          model,
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
              const full = `${message}${err ? `: ${describeError(err)}` : ""}`;
              setStatus("error");
              setError(full);
              addChatError(new Error(full));
            },
          },
        });

        sessionRef.current = session;
        session.setMicrophoneEnabled(!muted);
      } catch (e) {
        const full = describeError(e);
        setStatus("error");
        setError(full);
        addChatError(new Error(full));
        startedRef.current = false;
      }
    },
    [addChatError, audioRef, config, configureSession, customHeaders,
      flushPendingQueue, handleRealtimeEvent, maxOutputTokens, model,
      muted, providerMetadata, providerRealtimeConversationMetadata, status, toolChoice, tools, instructions]
  );

  const stop = useCallback(async () => {
    if (!sessionRef.current) {
      setStatus("idle");
      startedRef.current = false;
      return;
    }
    setStatus("stopping");
    const session = sessionRef.current;
    sessionRef.current = null;
    try {
      await session.stop();
    } finally {
      startedRef.current = false;
      setStatus("idle");
    }
  }, []);

  const setMicrophoneMuted = useCallback((nextMuted: boolean) => {
    setMuted(nextMuted);
    sessionRef.current?.setMicrophoneEnabled(!nextMuted);
  }, []);

  const sendMessage = useCallback(
    async (message: UIMessage) => {
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
    [model, persistMessage, sendEvent, start, status]
  );

  useEffect(() => {
    return () => {
      void stop();
    };
  }, [stop]);

  return useMemo(
    () => ({
      status,
      error,
      muted,
      messages,
      events,
      tools,
      start,
      stop,
      setMicrophoneMuted,
      sendMessage,
    }),
    [error, events, messages, muted, sendMessage, setMicrophoneMuted, start, status, stop, tools]
  );
}

