import { useEffect } from "react";
import { usePlugins } from "aihappey-plugins";
import { useAppStore, type ServerItem } from "aihappey-state";

export function AgentPluginRuntimeBinding() {
  const plugins = usePlugins();
  const reconcile = useAppStore((state) => state.reconcileAgentPluginMcpServers);

  useEffect(() => {
    if (plugins.enabledLoading) return;

    const validIds = plugins.enabled.map((plugin) => plugin.id);
    const servers: Record<string, ServerItem> = {};
    for (const plugin of plugins.enabled) {
      for (const server of plugin.mcpServers) {
        servers[server.key] = {
          config: {
            type: server.type,
            url: server.url,
            disabled: false,
            ...(server.headers ? { headers: server.headers } : {}),
          },
          source: {
            kind: "agent-plugin",
            pluginId: plugin.id,
            pluginName: plugin.name,
            serverName: server.serverName,
            ...(server.settings?.allowed_callers?.length
              ? { allowed_callers: server.settings.allowed_callers }
              : {}),
            ...(typeof server.settings?.defer_loading === "boolean"
              ? { defer_loading: server.settings.defer_loading }
              : {}),
            ...(server.settings?.namespace === true ? { namespace: true } : {}),
          },
        };
      }
    }

    reconcile(validIds, servers);
  }, [plugins.enabled, plugins.enabledLoading, reconcile]);

  return null;
}
