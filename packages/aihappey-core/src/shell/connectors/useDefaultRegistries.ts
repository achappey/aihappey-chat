import { useAppStore } from "aihappey-state";
import { defaultRegistries } from "../../runtime/chat-app/defaultRegistries";

export function useDefaultRegistries() {
    const addMcpRegistry = useAppStore((s) => s.addMcpRegistry);

    return async () => {
        var registries = await defaultRegistries()
        Object.entries(registries)
            .forEach(([uri, servers]) => {
                addMcpRegistry(uri, servers);
            });
    };
}