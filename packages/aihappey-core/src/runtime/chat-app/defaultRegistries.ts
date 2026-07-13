import { McpRegistryServerResponse } from "aihappey-types";

export type RegistryLoadProgress = {
    completed: number;
    total: number;
};

export const defaultRegistries = async (
    catalogUrls: string[] = [],
    onProgress?: (progress: RegistryLoadProgress) => void
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

    const uniqueCatalogUrls = Array.from(new Set(catalogUrls.map((url) => url.trim()).filter(Boolean)));
    let completed = 0;
    onProgress?.({ completed, total: uniqueCatalogUrls.length });

    const entries = await Promise.all(
        uniqueCatalogUrls
            .map(async (storeUri) => {
                try {
                    const servers = await loadAllServersForStore(storeUri);
                    return servers.length > 0 ? [storeUri, servers] as const : null;
                } finally {
                    completed += 1;
                    onProgress?.({ completed, total: uniqueCatalogUrls.length });
                }
            })
    );

    return Object.fromEntries(entries.filter(Boolean) as [string, McpRegistryServerResponse[]][]);
};
