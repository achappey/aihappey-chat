import { useAppStore } from "aihappey-state";
import { defaultRegistries } from "../../runtime/chat-app/defaultRegistries";
import { useChatContext } from "../../features/chat/context/ChatContext";

export function useDefaultRegistries() {
    const addMcpRegistry = useAppStore((s) => s.addMcpRegistry);
    const mcpRegistries = useAppStore((s) => s.mcpRegistries);
    const { config } = useChatContext();

    return async () => {
        const catalogUrls = (config.mcpCatalogUrls ?? [])
            .map((url) => url.trim())
            .filter((url) => url && !mcpRegistries[url]);

        if (catalogUrls.length === 0) return;

        var registries = await defaultRegistries(catalogUrls)
        Object.entries(registries)
            .forEach(([uri, servers]) => {
                addMcpRegistry(uri, servers);
            });
    };
}
