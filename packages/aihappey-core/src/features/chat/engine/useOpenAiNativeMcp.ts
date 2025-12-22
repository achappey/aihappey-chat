import { Tool } from "aihappey-mcp";
import { useMemo } from "react";

export function useOpenAiNativeMcp({
    clients,
    tools,
    providerMetadata,
    finalTools,
    getMcpAccessToken,
}: {
    clients?: Record<string, any> | undefined;
    tools: Tool[];
    providerMetadata: any;
    finalTools: any[];
    getMcpAccessToken: (url: string) => string | null;
}) {
    return useMemo(() => {
        if (!clients || Object.keys(clients).length === 0 || !providerMetadata.openai?.native_mcp) {
            return { metadata: providerMetadata, filteredTools: finalTools ?? [] };
        }

        const urls = Object.keys(clients ?? {});
        const metadata = {
            ...providerMetadata,
            openai: {
                ...providerMetadata.openai,
                mcp_list_tools: urls.map((r) => ({
                    server_url: r,
                    server_label: clients[r].getServerVersion?.()?.name,
                    require_approval: "never",
                    authorization: getMcpAccessToken(r),
                    //allowed_tools: tools[r]?.map((t) => t.name) ?? [],
                })),
            },
        };

        const mcpToolNames = new Set(
            metadata?.openai?.mcp_list_tools?.flatMap((s: any) =>
                s?.allowed_tools ?? []
            ) ?? []
        );

        const filteredTools = (finalTools ?? []).filter((t) => {
            const name = t?.function?.name ?? t?.name;
            return name && !mcpToolNames.has(name);
        });

        return { metadata, filteredTools };
    }, [clients, tools, providerMetadata, finalTools, getMcpAccessToken]);
}
