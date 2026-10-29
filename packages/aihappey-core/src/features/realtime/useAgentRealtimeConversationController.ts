import { useCallback, useEffect, useRef, useState } from "react";
import { Chat } from "aihappey-ai";
import { useConversations } from "aihappey-conversations";
import { mcpRuntime, store } from "aihappey-state";
import { getAgentCredentialModels, type Agent, type UIMessage } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";
import type { ChatConfig } from "../chat/context/ChatContext";
import { useChatErrors } from "../chat/layout/useChatErrors";
import { useTools } from "../tools/useTools";
import { useOnToolCall } from "../tools/toolcalls/useOnToolCall";
import { buildSelectedAgentRequest } from "../agents/agentSelection";
import { buildManagedAgentMcpCatalog, executeManagedAgentMcpTool, pendingManagedAgentMcpCalls, managedAgentMcpCallsPending } from "../chat/engine/managedAgentMcpTools";
import { createAgentChatContinuation } from "../chat/engine/agentChatContinuation";
import { activeAssistantMessages, agentRequestMessages, pendingToolApprovals } from "../chat/engine/toolApprovalState";
import { buildOperationHeaders, createCredentialScopedFetch } from "../provider-credentials/scopedRequest";
import { AgentRealtimeChatTransport } from "./AgentRealtimeChatTransport";
import { AgentAudioOutput } from "./agentSpeechPlayback";
import { AgentSpeechQueue, CompletedAgentText } from "./agentSpeechQueue";
import { startAgentTranscription } from "./startAgentTranscription";
import { RealtimeHistoryWriter } from "./realtimeHistoryWriter";
import { newUiMessage } from "./realtimeMessageParts";
import { StreamingAgentSpeech } from "./streamingAgentSpeech";
import { openAgentSpeech } from "./openAgentSpeech";
import { supportsRealtimeSpeech } from "../speech/realtime/speechProtocol";
import { isOpenAiSpeechModelId, supportsOpenAiSpeech } from "../speech/realtime/openAiSpeechConfig";

type Status = "idle" | "starting" | "connected" | "stopping" | "error";
type Run = { abort: AbortController; userId: string; chat?: Chat<any>; unsubscribe?: () => void; completed?: boolean };

export function useAgentRealtimeConversationController(args: {
    config: ChatConfig; conversationId: string; initialMessages: UIMessage[]; agent: Agent; agentKey: string;
}) {
    const { addMessage, updateMessage, refresh } = useConversations();
    const { addChatError } = useChatErrors();
    const { t, i18n } = useTranslation();
    const { tools, selectedLocalTools } = useTools();
    const toolUse = useOnToolCall({ api: args.config.baseUrl, getAccessToken: args.config.getAccessToken,
        conversationId: args.conversationId, headers: args.config.headers, customFetch: args.config.fetch,
        callTool: store.getState().callTool, tools,
        send: async () => { throw new Error("UI generation is not available during this voice session."); },
    });
    const latest = useRef({ ...args, addChatError, t, i18n, selectedLocalTools, toolUse, refresh });
    latest.current = { ...args, addChatError, t, i18n, selectedLocalTools, toolUse, refresh };
    const [status, setStatus] = useState<Status>("idle");
    const [muted, setMuted] = useState(false);
    const mutedRef = useRef(false);
    const [streaming, setStreaming] = useState(false);
    const [messages, setMessages] = useState<UIMessage[]>(args.initialMessages);
    const messagesRef = useRef<UIMessage[]>(args.initialMessages);
    const [events, setEvents] = useState<any[]>([]);
    const [approvalMessages, setApprovalMessages] = useState<UIMessage[]>([]);
    const lifetime = useRef<AbortController | null>(null);
    const transcription = useRef<Awaited<ReturnType<typeof startAgentTranscription>> | null>(null);
    const output = useRef<AgentAudioOutput | null>(null);
    const speech = useRef<AgentSpeechQueue | null>(null);
    const run = useRef<Run | null>(null);
    const draft = useRef<UIMessage | null>(null);
    const started = useRef(false);
    const stopping = useRef<Promise<void> | null>(null);
    const history = useRef<RealtimeHistoryWriter | null>(null);
    if (!history.current) history.current = new RealtimeHistoryWriter({
        add: message => addMessage(args.conversationId, message),
        update: message => updateMessage(args.conversationId, message.id, message),
        error: error => latest.current.addChatError(error instanceof Error ? error : new Error(String(error))),
    });
    const publish = useCallback((message: UIMessage, persist = false) => {
        const list = messagesRef.current;
        const index = list.findIndex(item => item.id === message.id);
        const next = index < 0 ? [...list, message] : list.map(item => item.id === message.id ? message : item);
        messagesRef.current = next; setMessages(next);
        if (persist) void history.current!.save(message);
        else if (!message.metadata?.inputDraft) history.current!.remember(message);
    }, []);
    useEffect(() => {
        history.current!.seed(args.initialMessages);
        if (!started.current) { messagesRef.current = args.initialMessages; setMessages(args.initialMessages); }
    }, [args.initialMessages]);

    const cancelRun = useCallback(() => {
        speech.current?.clear();
        setApprovalMessages([]);
        const previous = run.current; run.current = null;
        if (!previous) return;
        previous.abort.abort(); previous.unsubscribe?.();
        const previousMessages = previous.chat?.messages ?? [];
        const userIndex = previousMessages.findIndex(message => message.id === previous.userId);
        for (const message of previousMessages.slice(userIndex < 0 ? previousMessages.length : userIndex + 1)) {
            if (message.role === "assistant") publish({ ...message, metadata: { ...message.metadata,
                realtime: true, realtimeAgent: latest.current.agentKey, ...(!previous.completed ? { interrupted: true } : {}),
            } }, true);
        }
        void previous.chat?.stop(); setStreaming(false);
    }, [publish]);

    const sendMessage = useCallback(async (message: UIMessage) => {
        const current = latest.current;
        if (!lifetime.current || lifetime.current.signal.aborted) return;
        cancelRun();
        const request: Run = { abort: new AbortController(), userId: message.id }; run.current = request;
        const signal = AbortSignal.any([request.abort.signal, lifetime.current.signal]);
        const user = { ...message, metadata: { ...message.metadata, realtime: true, realtimeAgent: current.agentKey, inputDraft: false } };
        draft.current = null;
        publish(user, true);
        setStreaming(true);
        let observer: Pick<CompletedAgentText, "handle" | "finish"> | undefined;
        let responseIndex = 0;
        try {
            const state = store.getState();
            const speechModel = current.agent.speechModel;
            const catalogSpeech = state.models?.find(model => model.id === speechModel?.id);
            const streamedSpeech = speechModel && (supportsRealtimeSpeech(catalogSpeech) || supportsOpenAiSpeech(catalogSpeech))
                ? new StreamingAgentSpeech({ signal,
                    open: (started, token) => openAgentSpeech({ config: current.config, model: speechModel, customHeaders: state.customHeaders,
                        signal: token, context: output.current!.audioContext, started }),
                    legacy: (text, token) => output.current!.speak(current.config, state.customHeaders, speechModel, text, token),
                    allowLegacyFallback: !isOpenAiSpeechModelId(speechModel.id),
                    error: error => current.addChatError(new Error(`${current.t("agentRealtime.speechFailed")} ${error instanceof Error ? error.message : String(error)}`)),
                }) : undefined;
            const selected = buildSelectedAgentRequest([current.agentKey], state.agents, state.remoteAgentModels);
            if (!selected.entries.length) throw new Error(current.t("agentRealtime.unavailable"));
            const catalog = buildManagedAgentMcpCatalog(state, mcpRuntime, current.selectedLocalTools);
            const headers: Record<string, string> = { ...current.config.headers };
            if (current.config.agentScopes?.length) {
                const token = await current.config.getAgentAccessToken?.();
                if (!token && !headers.Authorization) throw new Error("Agent authentication is unavailable.");
                if (token) headers.Authorization = `Bearer ${token}`;
            } else {
                Object.assign(headers, await buildOperationHeaders({ ...current.config, getAccessToken: undefined }, state.customHeaders,
                    getAgentCredentialModels(current.agent).map(model => model.id)));
            }
            signal.throwIfAborted();
            const continuation = createAgentChatContinuation();
            const historicalIds = new Set(messagesRef.current.map(item => item.id));
            const responseIds = new Map<string, string>();
            const resolveMessageId = (id: string) => {
                if (!responseIds.has(id)) responseIds.set(id, historicalIds.has(id) ? crypto.randomUUID() : id);
                return responseIds.get(id)!;
            };
            const executed = new Set<string>();
            let executing = false;
            let responseCount = 0;
            const active = () => run.current === request && !signal.aborted;
            const chat = new Chat<any>({ id: current.conversationId,
                messages: messagesRef.current.filter(item => item.id !== user.id && !item.metadata?.inputDraft),
                onError: error => { if (active()) current.addChatError(error); },
                sendAutomaticallyWhen: options => active() && continuation.shouldSend(options),
                onFinish: ({ isAbort, isDisconnect }) => {
                    if (!active() || isAbort || isDisconnect) return;
                    setStreaming(false);
                    sync(true);
                    const pending = pendingToolApprovals(chat.messages);
                    request.completed = !pending.length && !managedAgentMcpCallsPending(chat.messages);
                    if (request.completed || streamedSpeech) observer?.finish(chat.messages.at(-1));
                    // Dispatch only the same unresolved client inputs ordinary Agent Chat dispatches.
                    // Backend-provided output and approval parts never reach this executor.
                    void executeReadyCalls();
                },
                transport: new AgentRealtimeChatTransport({
                    api: (current.config.agentEndpoint ?? current.config.baseUrl).replace(/\/$/, "") + "/api/chat",
                    headers, fetch: createCredentialScopedFetch(current.config.fetch),
                    body: { agents: selected.requestAgents, models: selected.models, tools: catalog.tools,
                        temperature: state.temperature, maxOutputTokens: state.maxOutputTokens, maxToolCalls: state.maxToolCalls,
                        toolChoice: state.toolChoice, workflowType: "sequential",
                    },
                    prepareSendMessagesRequest: options => {
                        signal.throwIfAborted();
                        if (++responseCount > (state.maxToolCalls ?? 50) + 1) throw new Error("Agent tool limit reached.");
                        continuation.submitted(options.messages);
                        const index = responseIndex++;
                        observer = streamedSpeech?.response(`${user.id}:${index}`) ?? new CompletedAgentText((id, text) => {
                            if (active()) speech.current?.enqueue(`${user.id}:${index}:${id}`, text);
                        });
                        request.completed = false; setStreaming(true);
                        return { api: options.api, headers: options.headers, credentials: options.credentials,
                            body: { ...options.body, id: options.id, messages: agentRequestMessages(options.messages),
                                trigger: options.trigger, messageId: options.messageId },
                        };
                    },
                }, chunk => { if (!signal.aborted) observer?.handle(chunk); }, resolveMessageId),
            });
            request.chat = chat;
            const sync = (persist = false) => {
                if (signal.aborted) return;
                setApprovalMessages(activeAssistantMessages(chat.messages));
                const userIndex = chat.messages.findIndex(item => item.id === user.id);
                if (userIndex < 0) return;
                for (const assistant of chat.messages.slice(userIndex + 1).filter(item => item.role === "assistant")) {
                    publish({ ...assistant, metadata: { ...assistant.metadata, realtime: true, realtimeAgent: current.agentKey } }, persist);
                }
            };
            const executeReadyCalls = async () => {
                if (!active() || executing || chat.status !== "ready") return;
                executing = true;
                try {
                    for (const toolCall of pendingManagedAgentMcpCalls(chat.messages, chat.status)) {
                        const key = JSON.stringify([toolCall.toolCallId]);
                        if (executed.has(key)) continue;
                        executed.add(key);
                        const result = await executeManagedAgentMcpTool(catalog, toolCall, state.callTool, current.i18n.language, signal,
                            options => current.toolUse.onToolCall(options));
                        if (!active()) return;
                        await chat.addToolOutput({ tool: toolCall.toolName, toolCallId: toolCall.toolCallId, output: result });
                        sync(true);
                    }
                } catch (error) { if (active()) current.addChatError(error instanceof Error ? error : new Error(String(error))); }
                finally { executing = false; }
            };
            request.unsubscribe = chat["~registerMessagesCallback"](() => sync());
            // A no-argument send can resume hydrated approval history. A new turn
            // must submit its user explicitly rather than target an older assistant.
            await chat.sendMessage(user); signal.throwIfAborted();
            await executeReadyCalls();
            sync(true);
        } catch (error) {
            if (!signal.aborted) current.addChatError(error instanceof Error ? error : new Error(String(error)));
        } finally {
            if (run.current === request) setStreaming(request.chat?.status === "streaming" || request.chat?.status === "submitted");
        }
    }, [cancelRun, publish]);

    const respondToToolApproval = useCallback(async (decision: { id: string; approved: boolean; reason?: string }) => {
        const request = run.current;
        if (!request?.chat || request.abort.signal.aborted) return;
        if (!pendingToolApprovals(request.chat.messages).some(entry => entry.approvalId === decision.id)) return;
        await request.chat.addToolApprovalResponse(decision);
        if (run.current !== request || request.abort.signal.aborted) return;
        for (const message of activeAssistantMessages(request.chat.messages)) publish({ ...message,
            metadata: { ...message.metadata, realtime: true, realtimeAgent: latest.current.agentKey },
        }, true);
        setApprovalMessages(activeAssistantMessages(request.chat.messages));
    }, [publish]);

    const start = useCallback(async (initialMessage?: UIMessage) => {
        if (started.current) return;
        const current = latest.current;
        const controller = new AbortController(); lifetime.current = controller;
        started.current = true; stopping.current = null; setStatus("starting");
        output.current ??= new AgentAudioOutput(); output.current.unlock();
        if (current.agent.speechModel?.id) speech.current = new AgentSpeechQueue(
            (text, signal) => output.current!.speak(current.config, store.getState().customHeaders, current.agent.speechModel!, text, signal),
            error => current.addChatError(new Error(`${current.t("agentRealtime.speechFailed")} ${error instanceof Error ? error.message : String(error)}`)));
        try {
            const session = await startAgentTranscription({ config: current.config, model: current.agent.transcriptionModel!,
                customHeaders: store.getState().customHeaders, signal: controller.signal,
                onStart: () => { if (!controller.signal.aborted) cancelRun(); },
                onPreview: text => {
                    if (controller.signal.aborted) return;
                    if (!text) {
                        if (draft.current) { messagesRef.current = messagesRef.current.filter(item => item.id !== draft.current!.id); setMessages(messagesRef.current); draft.current = null; }
                        return;
                    }
                    draft.current ??= newUiMessage("user", [], { realtime: true, input: "audio", inputDraft: true, realtimeAgent: current.agentKey });
                    draft.current = { ...draft.current, parts: [{ type: "text", text }] };
                    publish(draft.current);
                },
                onTurn: text => {
                    if (!controller.signal.aborted && text.trim())
                        void sendMessage({ ...(draft.current ?? newUiMessage("user", [], { input: "audio" })), parts: [{ type: "text", text }] });
                },
                onEvent: event => setEvents(previous => [event, ...previous].slice(0, 60)),
                onError: error => { current.addChatError(error); controller.abort(); cancelRun(); started.current = false; setStatus("error"); },
            });
            if (controller.signal.aborted) { await session.stop(); return; }
            transcription.current = session; session.setMuted(mutedRef.current); setStatus("connected");
            if (initialMessage) await sendMessage(initialMessage);
        } catch (error) {
            if (!controller.signal.aborted) { current.addChatError(error instanceof Error ? error : new Error(String(error))); setStatus("error"); }
            started.current = false;
        }
    }, [cancelRun, publish, sendMessage]);

    const stop = useCallback(() => {
        if (stopping.current) return stopping.current;
        lifetime.current?.abort(); cancelRun(); setStatus("stopping");
        const session = transcription.current; transcription.current = null;
        stopping.current = (async () => {
            await session?.stop();
            if (draft.current) publish({ ...draft.current, metadata: { ...draft.current.metadata, inputDraft: false, interrupted: true } }, true);
            draft.current = null;
            await history.current!.flush(); await latest.current.refresh();
            output.current?.dispose(); output.current = null;
            started.current = false; setStatus("idle");
        })();
        void stopping.current.catch(() => { stopping.current = null; });
        return stopping.current;
    }, [cancelRun, publish]);
    useEffect(() => () => { void stop().catch(error => latest.current.addChatError(error)); }, [stop]);
    return { status, muted, streaming, messages, events, tools,
        approvalMessages, respondToToolApproval,
        start, stop, sendMessage,
        setMicrophoneMuted: (value: boolean) => { mutedRef.current = value; setMuted(value); transcription.current?.setMuted(value); },
        cameraEnabled: false, cameraSupported: false, cameraStream: null,
        setCameraEnabled: async (_enabled: boolean) => {}, sendDtmf: (_digit: string) => {},
    };
}
