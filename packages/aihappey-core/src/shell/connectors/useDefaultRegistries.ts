import { useCallback } from "react";
import { useAppStore } from "aihappey-state";
import { defaultRegistries, type RegistryLoadProgress } from "../../runtime/chat-app/defaultRegistries";
import { useChatContext } from "../../features/chat/context/ChatContext";

export function useDefaultRegistries() {
    const addMcpRegistry = useAppStore((s) => s.addMcpRegistry);
    const mcpRegistries = useAppStore((s) => s.mcpRegistries);
    const { config } = useChatContext();

    return useCallback(async (options?: { onProgress?: (progress: RegistryLoadProgress) => void }) => {
        const catalogUrls = (config.mcpCatalogUrls ?? [])
            .map((url) => url.trim())
            .filter((url) => url && !mcpRegistries[url]);

        if (catalogUrls.length === 0) {
            options?.onProgress?.({ completed: 0, total: 0 });
            return;
        }

        var registries = await defaultRegistries(catalogUrls, options?.onProgress)
        Object.entries(registries)
            .forEach(([uri, servers]) => {
                addMcpRegistry(uri, servers);
            });
    }, [addMcpRegistry, config.mcpCatalogUrls, mcpRegistries]);
}
