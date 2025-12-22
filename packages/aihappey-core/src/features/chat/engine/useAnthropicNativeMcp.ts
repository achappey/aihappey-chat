import { Tool } from "aihappey-mcp";
import { useMemo } from "react";

export function useAnthropicNativeMcp({
    clients,
    tools,
    providerMetadata,
    finalTools,
    getMcpAccessToken,
}: {
    clients: Record<string, any> | undefined;
    tools: Tool[];
    providerMetadata: any;
    finalTools: any[];
    getMcpAccessToken: (url: string) => string | null;
}) {
    return useMemo(() => {
        if (!clients || Object.keys(clients).length === 0 || !providerMetadata.anthropic?.native_mcp) {
            return { metadata: providerMetadata, filteredTools: finalTools ?? [] };
        }

        const urls = Object.keys(clients ?? {});
        const metadata = {
            ...providerMetadata,
            anthropic: {
                ...providerMetadata.anthropic,
                mcp_servers: urls.map((r) => ({
                    url: r,
                    name: clients[r].getServerVersion?.()?.name,
                    authorization_token: getMcpAccessToken(r),
                    tool_configuration: {
                        enabled: true,
                        allowed_tools: []
                       // allowed_tools: tools[r]?.map((t) => t.name) ?? [],
                    },
                })),
            },
        };

        const mcpToolNames = new Set(
            metadata?.anthropic?.mcp_servers?.flatMap((s: any) =>
                s?.tool_configuration?.enabled
                    ? s.tool_configuration?.allowed_tools ?? []
                    : []
            ) ?? []
        );

        const filteredTools = (finalTools ?? []).filter((t) => {
            const name = t?.function?.name ?? t?.name;
            return name && !mcpToolNames.has(name);
        });

        return { metadata, filteredTools };
    }, [clients, tools, providerMetadata, finalTools, getMcpAccessToken]);
}
