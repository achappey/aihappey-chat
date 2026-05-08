import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getRealtimeToken } from "aihappey-ai";
import { useConversations } from "aihappey-conversations";
import { useAppStore } from "aihappey-state";
import type { UIMessage } from "aihappey-types";
import type { ChatConfig } from "../chat/context/ChatContext";
import { useChatErrors } from "../chat/layout/useChatErrors";
import { useOnToolCall } from "../tools/toolcalls/useOnToolCall";
import { useTools } from "../tools/useTools";
import { startRealtimeConversationWebrtcSession, type RealtimeConversationWebrtcSession } from "./startRealtimeConversationWebrtc";
import {
  extractFunctionCallsFromRealtimeResponse,
  extractTextFromRealtimeResponse,
  mcpToolToRealtimeFunctionTool,
  newUiMessage,
  realtimeContentToText,
  stripProviderPrefix,
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

const isPlainRecord = (value: any): value is Record<string, any> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const compactUndefined = (value: any): any => {
  if (Array.isArray(value)) return value.map(compactUndefined);
  if (!isPlainRecord(value)) return value;
  const next: Record<string, any> = {};
  for (const [key, child] of Object.entries(value)) {
    if (child === undefined) continue;
    next[key] = compactUndefined(child);
  }
  return next;
};

const deepMerge = (...values: any[]) => {
  const out: Record<string, any> = {};
  for (const value of values) {
    if (!isPlainRecord(value)) continue;
    for (const [key, child] of Object.entries(value)) {
      if (child === undefined) continue;
      if (isPlainRecord(child) && isPlainRecord(out[key])) {
        out[key] = deepMerge(out[key], child);
      } else {
        out[key] = child;
      }
    }
  }
  return out;
};

const buildRealtimeSessionConfig = (args: {
  model: string;
  realtimeOpenAiMetadata: any;
  chatOpenAiMetadata: any;
  instructions?: string;
  maxOutputTokens?: number;
  realtimeTools?: any[];
  selectedToolChoice?: any;
}) => {
  const sessionOverrides = args.realtimeOpenAiMetadata?.session?.type === "realtime"
    ? args.realtimeOpenAiMetadata.session
    : {};

  const chatDefaults = compactUndefined({
    instructions: args.instructions ?? args.chatOpenAiMetadata?.instructions,
    // reasoning: args.chatOpenAiMetadata?.reasoning,
    //parallel_tool_calls: args.chatOpenAiMetadata?.parallel_tool_calls,
    truncation: args.chatOpenAiMetadata?.truncation,
  });

  const appDefaults = compactUndefined({
    type: "realtime",
    model: stripProviderPrefix(args.model),
    output_modalities: ["audio"],
    /*  reasoning: args.chatOpenAiMetadata?.reasoning ? {
        effort: args.chatOpenAiMetadata?.reasoning.effort
      } : {
  
      },*/
    max_output_tokens: args.maxOutputTokens,
    audio: {
      input: {
        turn_detection: {
          type: "semantic_vad",
          eagerness: "auto",
          create_response: true,
          interrupt_response: true,
        },
      },
      output: {
        voice: args.realtimeOpenAiMetadata?.voice ?? sessionOverrides?.audio?.output?.voice ?? "marin",
      },
    },
    ...(args.realtimeTools?.length ? { tools: args.realtimeTools, tool_choice: args.selectedToolChoice ?? "auto" } : {}),
  });

  if (args.chatOpenAiMetadata?.reasoning) {
    appDefaults.reasoning = {
      effort: args.chatOpenAiMetadata?.reasoning.effort
    }

    appDefaults.parallel_tool_calls = args.chatOpenAiMetadata?.parallel_tool_calls
  }

  return deepMerge(chatDefaults, appDefaults, sessionOverrides, {
    type: "realtime",
    model: stripProviderPrefix(args.model),
  });
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

  const sessionRef = useRef<RealtimeConversationWebrtcSession | null>(null);
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
      const name = String(functionCall.name ?? "");
      if (!callId || !name || functionCallsInFlightRef.current.has(callId)) return;
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
    const realtimeTools = (tools ?? []).map(mcpToolToRealtimeFunctionTool);
    const realtimeOpenAiMetadata = (providerRealtimeConversationMetadata as any)?.openai ?? {};
    const chatOpenAiMetadata = (providerMetadata as any)?.openai ?? {};
    const selectedToolChoice = toolChoice === "none" ? "none" : "auto";

    sendEvent({
      type: "session.update",
      session: buildRealtimeSessionConfig({
        model,
        realtimeOpenAiMetadata,
        chatOpenAiMetadata,
        instructions,
        maxOutputTokens,
        realtimeTools,
        selectedToolChoice,
      }),
    });
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

        for (const functionCall of extractFunctionCallsFromRealtimeResponse(event?.response)) {
          void executeFunctionCall(functionCall);
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
        const merged = { ...(config?.headers ?? {}), ...(customHeaders ?? {}) } as Record<string, string>;
        if (config?.getAccessToken) {
          merged.Authorization = `Bearer ${await config.getAccessToken()}`;
        }

        const tokenClientFactory = await getRealtimeToken({
          baseUrl: config.baseUrl + config.endpoints.realtime,
          headers: merged,
        });

        const realtimeOpenAiMetadata = (providerRealtimeConversationMetadata as any)?.openai ?? {};
        const chatOpenAiMetadata = (providerMetadata as any)?.openai ?? {};
        const realtimeTools = (tools ?? []).map(mcpToolToRealtimeFunctionTool);
        const selectedToolChoice = toolChoice === "none" ? "none" : "auto";
        const sessionConfig = buildRealtimeSessionConfig({
          model,
          realtimeOpenAiMetadata,
          chatOpenAiMetadata,
          instructions,
          maxOutputTokens,
          realtimeTools,
          selectedToolChoice,
        });
        const session = await startRealtimeConversationWebrtcSession({
          getEphemeralToken: () =>
            tokenClientFactory({
              model,
              providerOptions: {
                ...(providerRealtimeConversationMetadata ?? {}),
                openai: {
                  ...realtimeOpenAiMetadata,
                  session: sessionConfig,
                },
              },
            }),
          events: {
            onRemoteStream: (stream) => {
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
            onError: (message, err) => {
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

