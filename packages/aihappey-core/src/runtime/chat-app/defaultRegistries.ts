import { mcpRuntime } from "aihappey-state";
import { McpRegistryServerResponse } from "aihappey-types";

export const defaultRegistries = async (
): Promise<Record<string, McpRegistryServerResponse[]>> => {
    const client = mcpRuntime.get("chatapp");

    if (!client) {
        throw new Error("ChatApp MCP is not connected");
    }

    const res = await client.listResources();

    async function loadAllServersForStore(storeUri: string) {
        const allServers: any[] = [];
        let cursor: string | undefined;

        while (true) {
            const uri = cursor
                ? `${storeUri}${storeUri.includes("?") ? "&" : "?"}cursor=${encodeURIComponent(cursor)}`
                : storeUri;

            const resource = await client!.readResource({ uri });

            for (const content of resource.contents ?? []) {
                if (!("text" in content)) continue;

                try {
                    const result = JSON.parse(content.text as string);

                    if (Array.isArray(result.servers)) {
                        allServers.push(
                            ...result.servers.filter((a: any) =>
                                a.server.remotes?.some((z: any) => z.type === "streamable-http")
                            )
                        );
                    }

                    cursor = result?.metadata?.next_cursor;

                }
                catch (err) { 
                    cursor = undefined
                }
            }

            if (!cursor) break;
        }

        return allServers;
    }

    const entries = await Promise.all(
        res.resources
            .filter(
                (r: any) =>
                    r.mimeType === "application/vnd.modelcontextprotocol-registry+json"
            )
            .map(async (store: any) => {
                const servers = await loadAllServersForStore(store.uri);
                return servers.length > 0 ? [store.uri, servers] as const : null;
            })
    );

    return Object.fromEntries(entries.filter(Boolean) as [string, McpRegistryServerResponse[]][]);
};
