import { McpRegistryServerResponse } from "aihappey-types";

export const defaultRegistries = async (
    catalogUrls: string[] = []
): Promise<Record<string, McpRegistryServerResponse[]>> => {
    async function loadAllServersForStore(storeUri: string) {
        const allServers: any[] = [];
        let cursor: string | undefined;

        while (true) {
            const uri = cursor
                ? `${storeUri}${storeUri.includes("?") ? "&" : "?"}cursor=${encodeURIComponent(cursor)}`
                : storeUri;

            try {
                const response = await fetch(uri, { method: "GET" });
                if (!response.ok) throw new Error(`Failed to fetch MCP catalog (${response.status})`);
                const result = await response.json();

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

            if (!cursor) break;
        }

        return allServers;
    }

    const entries = await Promise.all(
        Array.from(new Set(catalogUrls.map((url) => url.trim()).filter(Boolean)))
            .map(async (storeUri) => {
                const servers = await loadAllServersForStore(storeUri);
                return servers.length > 0 ? [storeUri, servers] as const : null;
            })
    );

    return Object.fromEntries(entries.filter(Boolean) as [string, McpRegistryServerResponse[]][]);
};
