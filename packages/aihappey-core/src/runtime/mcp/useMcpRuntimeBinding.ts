import { useEffect, useRef } from "react";
import { useAppStore } from "aihappey-state";
import { mcpRuntime } from "aihappey-state/dist/slices/uiSlice";
import type {
    CreateMessageRequest, CreateMessageResult,
    ElicitRequest,
    ProgressNotification
} from "aihappey-mcp";
import { acquireAccessToken } from "aihappey-auth";
import { elicitRuntime } from "./elicitRuntime";
import { samplingRuntime } from "./samplingRuntime";
import { logRuntime } from "./logRuntime";
import { useConversations } from "aihappey-conversations";

/**
 * Keeps the MCP Runtime in sync with the enabled mcpServers from Zustand.
 */
export function useMcpRuntimeBinding({
    samplingApi,
    agentApi,
    agentScopes,
    clientVersion,
    authenticated,
    clientName,
}: any) {
    const mcpServers = useAppStore((s) => s.mcpServers);
    const connectMcpServer = useAppStore((s) => s.connectMcpServer);
    const customHeaders = useAppStore((s) => s.customHeaders);
    const clearMcpContent = useAppStore((s) => s.clearMcpContent);
    const addProgress = useAppStore((s) => s.addProgress);
    const conversations = useConversations()
    const addSampling = useAppStore((s) => s.addSampling);
    const onElicit = (server: string, params: ElicitRequest) => elicitRuntime.onElicit(server, params);
    const onProgress = async (notif: ProgressNotification) => addProgress(notif);

    const onSample = async (server: string, params: CreateMessageRequest) => {
        const msg0 = (params as any)?.params?.messages?.[0];
        const sig = JSON.stringify({
            server,
            // whatever is stable in your request:
            model: (params as any)?.params?.model,
            firstRole: msg0?.role,
            firstText: typeof msg0?.content === "string" ? msg0?.content : msg0?.content?.text,
            // if your CreateMessageRequest has an id somewhere:
            reqId: (params as any)?.id ?? (params as any)?._meta?.id ?? null,
        });

        const { id, createdAt } = samplingRuntime.startSampling(server, params)
        const accessToken = authenticated ? await acquireAccessToken() : null;
        const res = await fetch(samplingApi, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                ...customHeaders,
            },
            body: JSON.stringify(params.params),
        });
        samplingRuntime.finishSampling(id)
        if (!res.ok) {
            addSampling(id, createdAt, server, params, undefined)
            throw new Error(`Sampling failed (${res.status})`);
        }

        const json: CreateMessageResult = await res.json();
        addSampling(id, createdAt, server, params, json)

        return json;
    };

    const conversationImport = async (conversation: any) => {
        var current = await conversations.list();
        if (!current.find(a => a.id === conversation.id)) {
            await conversations.import(conversation)

            conversations.refresh();
        }
    }

    const onLogging = (server: any, req: any) => logRuntime.append({
        ...req,
        server
    })

    useEffect(() => {
        if (!mcpServers) return;
        const items: any[] = []

        // Loop through all configured servers
        Object.entries(mcpServers).map(async ([name, cfg]) => {
            const isDisabled = cfg.config.disabled === true;

            if (isDisabled) {
                // If disabled → ensure client is removed
                clearMcpContent(name)
                if (mcpRuntime.get(name)) {
                    mcpRuntime.delete(name);
                }
                return;
            }

            // If enabled → ensure client exists or reconnect if config changed
            const existing = mcpRuntime.get(name);

            if (!existing) {

                var safeHeaders = {}

                if (authenticated) {
                    let token;
                    if (
                        cfg.config?.url &&
                        new URL(cfg.config.url).host === new URL(samplingApi).host
                    ) {
                        token = await acquireAccessToken();
                    } else if (
                        cfg.config?.url &&
                        agentScopes &&
                        agentScopes.length > 0 &&
                        new URL(cfg.config.url).host === new URL(agentApi).host
                    ) {
                        token = await acquireAccessToken(agentScopes);
                    }

                    if (token)
                        safeHeaders = {
                            "Authorization": `Bearer ${token}`
                        }
                }
                
                // Create persistent SSE/streamable client
                connectMcpServer(name, cfg.config.url, {
                    type: cfg.config.type,
                    headers: {
                        ...cfg.config.headers,
                        ...safeHeaders
                    },
                    handleOAuth: true,
                    onSample,
                    onElicit,
                    onLogging,
                    onProgress,
                    clientName,
                    clientVersion
                }, conversationImport)
                    .then((a: any) => items.push({
                        ...a,
                        name: name
                    }));
            }
        });

        return () => {
            items.forEach((i) => {
                try {
                    i.close()
                } catch (error) {
                    if (mcpRuntime.get(i.name)) {
                        mcpRuntime.delete(i.name);
                    }

                }
            });
        }
    }, [mcpServers]);
}


