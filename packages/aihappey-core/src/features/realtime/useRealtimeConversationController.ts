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

  const executeFunctionCall = useCallback(
    async (functionCall: any) => {
      const callId = String(functionCall.call_id ?? "");
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

      const result = await (toolUse.onToolCall as any)({
        toolCall: {
          toolCallId: callId,
          toolName: name,
          input,
        },
      });

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

      sendEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify(result),
        },
      });
      sendEvent({ type: "response.create" });
    },
    [model, persistMessage, sendEvent, toolUse.onToolCall, upsertLocalDraft]
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
          arguments: existing + String(event.delta ?? ""),
        };
        return;
      }

      if (type === "response.function_call_arguments.done" && event?.call_id) {
        const callId = String(event.call_id);
        functionCallArgsRef.current[callId] = {
          ...functionCallArgsRef.current[callId],
          name: event.name ?? functionCallArgsRef.current[callId]?.name,
          arguments: event.arguments ?? functionCallArgsRef.current[callId]?.arguments,
        };
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
          };
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
          void executeFunctionCall(functionCall);
        }
        for (const callId of functionCallsDoneRef.current) {
          if (handledFunctionCallsRef.current.has(callId)) continue;
          const functionCall = functionCallArgsRef.current[callId];
          if (functionCall?.name) void executeFunctionCall({ ...functionCall, call_id: callId });
        }
      }
    },
    [addChatError, executeFunctionCall, model, persistMessage, upsertLocalDraft]
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

