import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types";
import { DefaultChatTransport, useChat } from "aihappey-ai";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { MessageSourcesDrawer, AttachmentsDrawer, useTheme } from "aihappey-components";
import { SYSTEM_ROLE, type UIMessage } from "aihappey-types";
import { useChatContext } from "../chat/context/ChatContext";
import { useAuthFetch } from "../chat/engine/useAuthFetch";
import { useActiveProviderMetadata } from "../chat/engine/useActiveProviderMetadata";
import { MessageList } from "../chat/messages/MessageList";
import { MessageInput } from "../chat/input/MessageInput";
import { useAttachmentParts } from "../chat/messages/useAttachmentParts";
import { useUserMessageBuilder } from "../chat/messages/useUserMessageBuilder";
import { sendAutomaticallyWhen } from "../chat/engine/sendAutomaticallyWhen";
import { useApiRef } from "../chat/engine/useApiRef";
import { countCompletedToolCallsLastAssistant } from "../chat/engine/countCompletedToolCallsLastAssistant";
import { shouldForceToolChoiceNone } from "../chat/engine/shouldForceToolChoiceNone";
import { useUIStream } from "../json-render/useUIStream";
import { useSystemMessage } from "../chat/messages/useSystemMessage";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import { fileAttachmentRuntime } from "../../runtime/files/fileAttachmentRuntime";
import { mcpResourceRuntime } from "../../runtime/mcp/mcpResourceRuntime";
import { ToolApprovalModalHost } from "../tools/ToolApprovalModalHost";
import { WebAppDetailDrawerTabs } from "./WebAppDetailDrawerTabs";

type WebAppDetailChatDrawerProps = {
    open: boolean;
    onClose: () => void;
    appId?: string;
    app?: {
        name?: string;
        description?: string;
        data?: any;
        dataSource?: any;
    } | null;
    tree?: any;
    catalogPrompt: string;
    onStreamUpdate?: (tree: any) => void;
    onStreamComplete?: (tree: any) => void;
    onStreamError?: (error: Error) => void;
    onStreamingChange?: (streaming: boolean) => void;
    dataSourceValue: any;
    canRefresh: boolean;
    refreshing: boolean;
    dataRefreshError?: string;
    dataSourceError?: string;
    connectedServerKeys: string[];
    resourceOptions: any[];
    resourceTemplateOptions: any[];
    toolOptions: any[];
    structuredOutputOptions: any[];
    modelOptions: any[];
    onRefreshData: () => void;
    onDataSourceChange: (next: any) => void;
};

const JSON_RENDER_MIME = "application/vnd.vercel-app+json";

const webAppGenerateTool: Tool = {
    name: "generate_web_app_ui",
    title: "Generate web app UI update",
    description:
        "Generate UI updates for the current web app using /api/generate. Returns the updated UI tree.",
    inputSchema: {
        type: "object",
        properties: {
            prompt: {
                type: "string",
                description: "Describe the UI change to apply.",
            },
        },
        required: ["prompt"],
    },
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
};

const ok = (tree: any, uri: string, toolCallId: string): CallToolResult => ({
    isError: false,
    _meta: {
        toolCallId,
    },
    content: [
        {
            type: "resource",
            resource: {
                text: JSON.stringify(tree),
                mimeType: JSON_RENDER_MIME,
                uri,
            },
        },
    ],
});

const errorResult = (message: string, toolCallId?: string): CallToolResult => ({
    isError: true,
    _meta: toolCallId ? { toolCallId } : undefined,
    content: [
        {
            type: "text",
            text: message,
        },
    ],
});

export const WebAppDetailChatDrawer = ({
    open,
    onClose,
    appId,
    app,
    tree,
    catalogPrompt,
    onStreamUpdate,
    onStreamComplete,
    onStreamError,
    onStreamingChange,
    dataSourceValue,
    canRefresh,
    refreshing,
    dataRefreshError,
    dataSourceError,
    connectedServerKeys,
    resourceOptions,
    resourceTemplateOptions,
    toolOptions,
    structuredOutputOptions,
    modelOptions,
    onRefreshData,
    onDataSourceChange,
}: WebAppDetailChatDrawerProps) => {
    const { Drawer: DrawerPrimitive, Button, Spinner } = useTheme();
    const { t } = useTranslation();
    const isDesktop = useIsDesktop();
    const [drawerSize, setDrawerSize] = useState<"medium" | "large" | "full">("medium");
    const [sources, setSources] = useState<any[] | undefined>(undefined);
    const [messageAttachments, setMessageAttachments] = useState<any[] | undefined>(undefined);

    const model = useAppStore((s) => s.selectedModel);
    const customHeaders = useAppStore((s) => s.customHeaders);
    const maxOutputTokens = useAppStore((s) => s.maxOutputTokens);
    const toolChoice = useAppStore((s) => s.toolChoice);
    const maxToolCalls = useAppStore((s) => s.maxToolCalls);
    const stopTools = useAppStore((s) => s.stopTools);
    const { config } = useChatContext();
    useSystemMessage();
    const providerMetadata = useActiveProviderMetadata();

    const apiKeyHeaders = useMemo(
        () =>
            Object.fromEntries(
                Object.entries(customHeaders)
                    .filter(([key]) => model && key.toLocaleLowerCase().includes(model.split("/")[0]))
            ),
        [customHeaders, model]
    );

    const authFetch = useAuthFetch({
        chatMode: "chat",
        getAccessToken: config?.getAccessToken,
        headers: undefined,
        customHeaders: apiKeyHeaders,
    });

    const tools = useMemo(() => [webAppGenerateTool], []);
    const apiRef = useApiRef(config.baseUrl + config.endpoints.chat);
    const baseBody = useMemo(
        () => ({
            model: model ?? "openai/gpt-5.2",
            tools,
            maxOutputTokens,
            toolChoice,
            maxToolCalls,
            providerMetadata,
        }),
        [model, tools, maxOutputTokens, toolChoice, maxToolCalls, providerMetadata]
    );

    const appContextRef = useRef({
        appId,
        name: app?.name,
        description: app?.description,
    });

    useEffect(() => {
        appContextRef.current = {
            appId,
            name: app?.name,
            description: app?.description,
        };
    }, [appId, app?.name, app?.description]);

    const systemMessageRef = useRef<UIMessage | undefined>(undefined);
    const initialMessagesRef = useRef<UIMessage[] | null>(null);

    if (!systemMessageRef.current) {
        systemMessageRef.current = {
            id: crypto.randomUUID(),
            role: SYSTEM_ROLE,
            parts: [
                {
                    type: "text",
                    text: JSON.stringify({ webAppContext: appContextRef.current }),
                },
            ],
            metadata: {
                timestamp: new Date().toISOString(),
                author: SYSTEM_ROLE,
            },
        };
    }

    if (!initialMessagesRef.current && systemMessageRef.current) {
        initialMessagesRef.current = [systemMessageRef.current];
    }

    const appDataRef = useRef(app?.data);
    const treeRef = useRef(tree);
    const providerMetadataRef = useRef(providerMetadata);

    useEffect(() => {
        appDataRef.current = app?.data;
    }, [app?.data]);

    useEffect(() => {
        treeRef.current = tree;
    }, [tree]);

    useEffect(() => {
        providerMetadataRef.current = providerMetadata;
    }, [providerMetadata]);

    const authFetchRef = useRef(authFetch);
    const baseBodyRef = useRef(baseBody);
    const maxToolCallsRef = useRef(maxToolCalls);
    const stopToolsRef = useRef(stopTools);

    useEffect(() => {
        authFetchRef.current = authFetch;
    }, [authFetch]);

    useEffect(() => {
        baseBodyRef.current = baseBody;
    }, [baseBody]);

    useEffect(() => {
        maxToolCallsRef.current = maxToolCalls;
    }, [maxToolCalls]);

    useEffect(() => {
        stopToolsRef.current = stopTools;
    }, [stopTools]);

    const transportWithContext = useMemo(
        () =>
            new DefaultChatTransport({
                api: "/api/chat",
                fetch: (input, init) => (authFetchRef.current ?? fetch)(input, init),
                prepareSendMessagesRequest: (opts) => {
                    const latestSystem = systemMessageRef.current;
                    const nextMessages = (() => {
                        if (!latestSystem) return opts.messages;
                        const next = (opts.messages ?? []).map((msg, index) =>
                            index === 0 && msg.role === SYSTEM_ROLE ? latestSystem : msg
                        );
                        const hasSystem = next[0]?.role === SYSTEM_ROLE;
                        return hasSystem ? next : [latestSystem, ...next];
                    })();

                    const mergedBody: any = {
                        ...baseBodyRef.current,
                        ...(opts.body ?? {}),
                        id: opts.id,
                        messages: nextMessages,
                        trigger: opts.trigger,
                        messageId: opts.messageId,
                    };

                    const completedToolCalls =
                        typeof maxToolCallsRef.current === "number"
                            ? countCompletedToolCallsLastAssistant(nextMessages as any[])
                            : 0;

                    const forceNone =
                        shouldForceToolChoiceNone(nextMessages as any[], stopToolsRef.current) ||
                        (typeof maxToolCallsRef.current === "number" && completedToolCalls >= maxToolCallsRef.current);

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
        []
    );

    const onStreamCompleteRef = useRef(onStreamComplete);
    const onStreamErrorRef = useRef(onStreamError);

    useEffect(() => {
        onStreamCompleteRef.current = onStreamComplete;
    }, [onStreamComplete]);

    useEffect(() => {
        onStreamErrorRef.current = onStreamError;
    }, [onStreamError]);

    const handleStreamComplete = useCallback((nextTree: any) => {
        if (nextTree) {
            onStreamCompleteRef.current?.(nextTree);
        }
    }, []);

    const handleStreamError = useCallback((err: Error) => {
        onStreamErrorRef.current?.(err);
    }, []);

    const {
        tree: streamingTree,
        send: sendUiRequest,
        isStreaming,
        error: streamError,
    } = useUIStream({
        api: (config?.baseUrl ?? "") + "/api/generate",
        catalogPrompt,
        model,
        getAccessToken: config?.getAccessToken,
        customHeaders: apiKeyHeaders,
        initialTree: tree ?? null,
        onComplete: handleStreamComplete,
        onError: handleStreamError,
    });

    const inFlightStreamRef = useRef<Promise<any> | null>(null);
    const inFlightToolCallIdRef = useRef<string | null>(null);
    const sendUiRequestRef = useRef(sendUiRequest);

    useEffect(() => {
        sendUiRequestRef.current = sendUiRequest;
    }, [sendUiRequest]);

    useEffect(() => {
        if (streamingTree) {
            onStreamUpdate?.(streamingTree);
        }
    }, [streamingTree, onStreamUpdate]);

    useEffect(() => {
        if (streamError) {
            onStreamError?.(streamError);
        }
    }, [streamError, onStreamError]);

    useEffect(() => {
        onStreamingChange?.(isStreaming);
    }, [isStreaming, onStreamingChange]);

    const handleGenerateToolCall = useCallback(
        async (toolCall: { toolCallId: string; toolName: string; input?: any }) => {
            if (toolCall.toolName !== webAppGenerateTool.name) {
                return errorResult(`Unknown tool: ${toolCall.toolName}`, toolCall.toolCallId);
            }

            const prompt = String(toolCall.input?.prompt ?? "").trim();
            if (!prompt) {
                return errorResult("Missing prompt.", toolCall.toolCallId);
            }

            if (inFlightStreamRef.current) {
                const activeId = inFlightToolCallIdRef.current;
                if (activeId === toolCall.toolCallId) {
                    const existing = await inFlightStreamRef.current;
                    if (!existing) {
                        return errorResult("No UI result returned.", toolCall.toolCallId);
                    }
                    return ok(existing, `webapp://${appId ?? "unknown"}/${toolCall.toolCallId}`, toolCall.toolCallId);
                }

                await inFlightStreamRef.current;
            }

            const currentTree = treeRef.current;
            let promptToSend = prompt;

            if (currentTree?.root && Object.keys(currentTree.elements || {}).length > 0) {
                promptToSend = `CURRENT UI STATE (already loaded, DO NOT recreate existing elements):\n${JSON.stringify(currentTree, null, 2)}\n\nUSER REQUEST: ${prompt}\n\nIMPORTANT: The current UI is already loaded. Output ONLY the patches needed to make the requested change:\n- To add a new element: {"op":"add","path":"/elements/new-key","value":{...}}\n- To modify an existing element: {"op":"set","path":"/elements/existing-key","value":{...}}\n- To update the root: {"op":"set","path":"/root","value":"new-root-key"}\n- To remove an element: {"op":"remove","path":"/root"}\n- To add children: update the parent element with new children array\n\nDO NOT output patches for elements that don't need to change. Only output what's necessary for the requested modification.`;
            }

            const streamPromise = sendUiRequestRef.current(
                promptToSend,
                appDataRef.current,
                providerMetadataRef.current,
                currentTree ?? null
            );
            inFlightStreamRef.current = streamPromise;
            inFlightToolCallIdRef.current = toolCall.toolCallId;
            let result: any;
            try {
                result = await streamPromise;
            } finally {
                inFlightStreamRef.current = null;
                inFlightToolCallIdRef.current = null;
            }

            if (!result) {
                return errorResult("No UI result returned.", toolCall.toolCallId);
            }

            return ok(result, `webapp://${appId ?? "unknown"}/${toolCall.toolCallId}`, toolCall.toolCallId);
        },
        [appId]
    );

    useEffect(() => {
        inFlightStreamRef.current = null;
        inFlightToolCallIdRef.current = null;
    }, [appId]);

    const addToolOutputRef = useRef<any>(null);
    const pendingToolOutputsRef = useRef<
        Array<{ tool: string; toolCallId: string; output: any }>
    >([]);

    const onToolCall = useCallback(
        async ({ toolCall }: any) => {
            const result = await handleGenerateToolCall(toolCall);
            const payload = {
                tool: toolCall.toolName,
                toolCallId: toolCall.toolCallId,
                output: result,
            };

            if (addToolOutputRef.current) {
                addToolOutputRef.current(payload);
            } else {
                pendingToolOutputsRef.current.push(payload);
            }

            return result;
        },
        [handleGenerateToolCall]
    );


    const [chatError, setChatError] = useState<string | null>(null);

    const {
        messages,
        sendMessage,
        status,
        addToolOutput,
        addToolApprovalResponse,
        stop,
    } = useChat({
        id: `web-app-${appId ?? "unknown"}`,
        transport: transportWithContext,
        messages: initialMessagesRef.current ?? [systemMessageRef.current],
        sendAutomaticallyWhen,
        onToolCall: onToolCall as any,
        onError: (err: Error) => {
            setChatError(err.message || String(err));
        },
    });

    useEffect(() => {
        addToolOutputRef.current = addToolOutput;
        if (pendingToolOutputsRef.current.length) {
            const pending = [...pendingToolOutputsRef.current];
            pendingToolOutputsRef.current = [];
            pending.forEach((payload) => addToolOutput(payload));
        }
    }, [addToolOutput]);


    const getAttachmentParts = useAttachmentParts();
    const extractExif = useAppStore((s) => s.extractExif);
    const { buildFromText, buildFromPrompt } = useUserMessageBuilder({
        getAttachmentParts,
        extractExif,
    });

    const handleSend = useCallback(
        async (text: string) => {
            const userMsg = await buildFromText(text);
            if (!userMsg) return;

            await sendMessage(userMsg, {
                body: {
                    model: model ?? "openai/gpt-5.2",
                    tools,
                    maxOutputTokens,
                    providerMetadata,
                },
            });

            fileAttachmentRuntime.clear();
            mcpResourceRuntime.clear();
        },
        [buildFromText, sendMessage, model, tools, maxOutputTokens, providerMetadata]
    );

    const onPromptExecute = useCallback(
        async (prompt: any, args?: Record<string, string>) => {
            const userMsg = await buildFromPrompt(prompt, args);
            if (!userMsg) return;

            await sendMessage(userMsg, {
                body: {
                    model: model ?? "openai/gpt-5.2",
                    tools,
                    maxOutputTokens,
                    providerMetadata,
                },
            });

            fileAttachmentRuntime.clear();
            mcpResourceRuntime.clear();
        },
        [buildFromPrompt, sendMessage, model, tools, maxOutputTokens, providerMetadata]
    );

    const headerNavigation = (
        <div
            style={{
                display: "flex",
                width: "100%",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 4,
            }}
        >
            <Button
                icon="panelExpand"
                variant="transparent"
                disabled={drawerSize === "full"}
                onClick={() =>
                    setDrawerSize((prev) => (prev === "medium" ? "large" : "full"))
                }
            />
            <Button
                icon="panelContract"
                variant="transparent"
                disabled={drawerSize === "medium"}
                onClick={() =>
                    setDrawerSize((prev) => (prev === "full" ? "large" : "medium"))
                }
            />
        </div>
    );

    const chatContent = (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "hidden",
                minHeight: 0,
            }}
        >
            {chatError ? (
                <div style={{ padding: "8px 12px", color: "#a4262c" }}>
                    {chatError}
                </div>
            ) : null}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                <MessageList
                    messages={messages as UIMessage[]}
                    showCitations={(items) => setSources(items)}
                    showAttachments={(items) => setMessageAttachments(items)}
                />
            </div>
            <div
                style={{
                    flexShrink: 0,
                    paddingRight: 24,
                    paddingTop: 8,
                    boxSizing: "border-box",
                }}
            >
                {status === "submitted" || status === "streaming" ? <Spinner /> : null}

                <MessageInput
                    onSend={handleSend}
                    onPromptExecute={onPromptExecute}
                    onStop={stop}
                    disabled={status === "submitted" || status === "streaming"}
                    streaming={status === "submitted" || status === "streaming"}
                />
            </div>
        </div>
    );

    return (
        <>
            <DrawerPrimitive
                open={open}
                title={t("aiChat")}
                overlay={!isDesktop}
                size={isDesktop ? drawerSize : "small"}
                headerNavigation={headerNavigation}
                onClose={onClose}
            >
                <WebAppDetailDrawerTabs
                    app={app ?? null}
                    effectiveTree={tree}
                    dataSourceValue={dataSourceValue}
                    canRefresh={canRefresh}
                    refreshing={refreshing}
                    dataRefreshError={dataRefreshError}
                    dataSourceError={dataSourceError}
                    connectedServerKeys={connectedServerKeys}
                    resourceOptions={resourceOptions}
                    resourceTemplateOptions={resourceTemplateOptions}
                    toolOptions={toolOptions}
                    structuredOutputOptions={structuredOutputOptions}
                    modelOptions={modelOptions}
                    onRefreshData={onRefreshData}
                    onDataSourceChange={onDataSourceChange}
                    chatOpen={open}
                    chatContent={chatContent}
                />
            </DrawerPrimitive>
            <MessageSourcesDrawer
                open={sources != undefined}
                sources={sources?.filter((a) => a.type === "source-url") ?? []}
                size={isDesktop ? "medium" : "small"}
                onClose={() => setSources(undefined)}
            />
            <AttachmentsDrawer
                open={messageAttachments != undefined}
                size={isDesktop ? "medium" : "small"}
                attachments={messageAttachments ?? []}
                onClose={() => setMessageAttachments(undefined)}
            />
            <ToolApprovalModalHost
                messages={messages as UIMessage[]}
                tools={tools}
                status={status === "streaming" ? undefined : status}
                addToolApprovalResponse={addToolApprovalResponse}
            />
        </>
    );
};
