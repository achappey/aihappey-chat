import { useEffect, useRef } from "react";
import { useAppStore } from "aihappey-state";
import { mcpRuntime } from "aihappey-state/dist/slices/uiSlice";
import type {
    CreateMessageRequest, 
    ElicitRequest
} from "aihappey-mcp";
import { acquireAccessToken } from "aihappey-auth";
import { elicitRuntime } from "./elicitRuntime";
import { logRuntime } from "./logRuntime";
import { useConversations } from "aihappey-conversations";
import { progressRuntime } from "./progressRuntime";
import { ModelOption } from "aihappey-types";

const getUrlHost = (url: string | undefined): string | undefined => {
    if (!url) return undefined;

    try {
        return new URL(url).host;
    } catch {
        return undefined;
    }
};

export const applyModelHintsToParams = (
    params: CreateMessageRequest,
    models: ModelOption[] | undefined
): CreateMessageRequest => {

    const hints = params?.params?.modelPreferences?.hints;
    const meta = params?.params?.metadata;

    if (!models || !hints) return params;

    const modelNames = hints
        .filter(h => h.name != null)
        .map(h => h.name!);

    const activeModels = models.filter(m => {
        const modelName = m.id.split("/").slice(1).join("/");
        return modelName != null && modelNames.includes(modelName);
    });

    // ---- provider preference ----
    const preferredProviders =
        meta != null
            ? new Set(Object.keys(meta))
            : undefined;

    const orderedModels =
        preferredProviders && preferredProviders.size > 0
            ? [
                ...activeModels.filter(m => preferredProviders.has(m.id.split("/")[0])),
                ...activeModels.filter(m => !preferredProviders.has(m.id.split("/")[0]))
            ]
            : activeModels;

    return {
        ...params,
        params: {
            ...params.params,
            modelPreferences: {
                ...params.params?.modelPreferences,
                hints: orderedModels.map(m => ({ name: m.id }))
            }
        }
    };
};

/**
 * Keeps the MCP Runtime in sync with the enabled mcpServers from Zustand.
 */
export function useMcpRuntimeBinding({
    inferenceApi,
    agentApi,
    agentScopes,
    conversationsApi,
    conversationScopes,
    clientVersion,
    authenticated,
    clientName,
}: any) {
    const mcpServers = useAppStore((s) => s.mcpServers);
    const connectMcpServer = useAppStore((s) => s.connectMcpServer);
    const customHeaders = useAppStore((s) => s.customHeaders);
    const clearMcpContent = useAppStore((s) => s.clearMcpContent);
    const enabledProviders = useAppStore((s) => s.enabledProvidersByType?.language ?? []);
    const models = useAppStore((s) => s.models);
    const modelsRef = useRef(models);
    const customHeadersRef = useRef(customHeaders);
    const enabledProvidersRef = useRef(enabledProviders);
    const authenticatedRef = useRef(authenticated);
    const inferenceApiRef = useRef(inferenceApi);
    const pendingConnectionsRef = useRef(new Map<string, Promise<any>>());
    const conversations = useConversations()
    const onElicit = (server: string, params: ElicitRequest) => elicitRuntime.onElicit(server, params);
    const onProgress = async (notif: any) => {
        progressRuntime.update(notif);
    };

    useEffect(() => {
        modelsRef.current = models;
        customHeadersRef.current = customHeaders;
        enabledProvidersRef.current = enabledProviders;
        authenticatedRef.current = authenticated;
        inferenceApiRef.current = inferenceApi;
    }, [models, customHeaders, enabledProviders, authenticated, inferenceApi]);

    // const onProgress = async (notif: ProgressNotification) => addProgress(notif);

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
        const items: Array<{ name: string; close: () => void }> = [];
        let cancelled = false;

        const configuredNames = new Set(
            Object.entries(mcpServers)
                .filter(([, cfg]) => cfg.config.disabled !== true)
                .map(([name]) => name),
        );
        for (const [name, client] of mcpRuntime.entries()) {
            if (configuredNames.has(name)) continue;
            clearMcpContent(name);
            mcpRuntime.delete(name);
            void Promise.resolve(client.close()).catch(() => undefined);
        }

        // Loop through all configured servers
        Object.entries(mcpServers).forEach(([name, cfg]) => {
            const isDisabled = cfg.config.disabled === true;

            if (isDisabled) {
                // If disabled → ensure client is removed
                clearMcpContent(name)
                const client = mcpRuntime.get(name);
                if (client) {
                    mcpRuntime.delete(name);
                    void Promise.resolve(client.close()).catch(() => undefined);
                }
                return;
            }

            const connect = async () => {
                const previous = pendingConnectionsRef.current.get(name);
                if (previous) {
                    try { await previous; } catch { /* a fresh attempt follows */ }
                }
                if (cancelled || cfg.config.disabled === true || mcpRuntime.get(name)) return;

                var safeHeaders = {};

                if (authenticated) {
                    let token;
                    const mcpHost = getUrlHost(cfg.config?.url);

                    if (
                        mcpHost &&
                        mcpHost === getUrlHost(inferenceApi)
                    ) {
                        token = await acquireAccessToken();
                    } else if (
                        mcpHost &&
                        agentScopes &&
                        agentScopes.length > 0 &&
                        mcpHost === getUrlHost(agentApi)
                    ) {
                        token = await acquireAccessToken(agentScopes);
                    } else if (
                        mcpHost &&
                        conversationScopes &&
                        conversationScopes.length > 0 &&
                        mcpHost === getUrlHost(conversationsApi)
                    ) {
                        token = await acquireAccessToken(conversationScopes);
                    }

                    if (token)
                        safeHeaders = {
                            "Authorization": `Bearer ${token}`
                        }
                }

                // Create persistent SSE/streamable client
                const pending = connectMcpServer(name, cfg.config.url, {
                    type: cfg.config.type,
                    headers: {
                        ...cfg.config.headers,
                        ...safeHeaders
                    },
                    handleOAuth: true,
                    onElicit,
                    onLogging,
                    onProgress,
                    clientName,
                    clientVersion
                }, conversationImport);
                pendingConnectionsRef.current.set(name, pending);
                try {
                    const connection = await pending;
                    if (cancelled) {
                        connection.close();
                        return;
                    }
                    items.push({ name, close: connection.close });
                } finally {
                    if (pendingConnectionsRef.current.get(name) === pending) {
                        pendingConnectionsRef.current.delete(name);
                    }
                }
            };

            const existing = mcpRuntime.get(name);
            if (!existing || pendingConnectionsRef.current.has(name)) {
                void connect().catch(() => undefined);
            }
        });

        return () => {
            cancelled = true;
            items.forEach((i) => {
                try {
                    i.close();
                } catch { /* cleanup continues */ }
                mcpRuntime.delete(i.name);
                clearMcpContent(i.name);
            });
        }
    }, [
        mcpServers,
        inferenceApi,
        agentApi,
        agentScopes,
        conversationsApi,
        conversationScopes,
        authenticated,
        clientName,
        clientVersion,
        clearMcpContent,
        connectMcpServer,
    ]);
}


