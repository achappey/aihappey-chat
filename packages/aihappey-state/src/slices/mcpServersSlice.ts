import { McpRegistryServerResponse, ServerClientConfig } from "aihappey-types";
import type { StateCreator } from "zustand";

export type ServerItem = {
  config: ServerClientConfig;
  registry?: McpRegistryServerResponse;
  source?: {
    kind: "agent-plugin";
    pluginId: string;
    pluginName: string;
    serverName: string;
    allowed_callers?: Array<"direct" | "programmatic">;
    defer_loading?: boolean;
    namespace?: boolean;
  };
};

export type McpServersSlice = {
  mcpServers: Record<string, ServerItem>;
  addMcpServer: (name: string, cfg: ServerItem) => void;
  updateMcpServer: (name: string, cfg: ServerClientConfig) => void;
  removeMcpServer: (name: string) => void;
  updateMcpServers: (patches: Record<string, Partial<ServerClientConfig>>) => any
  reconcileAgentPluginMcpServers: (enabledPluginIds: string[], servers: Record<string, ServerItem>) => void;
};

export const createMcpServersSlice: StateCreator<
  any,
  [],
  [],
  McpServersSlice
> = (set, get, store) => ({
  mcpServers: {},
  addMcpServer: (name, cfg) => {
    if(!name || !name.length) throw new Error("name required")
    set((state: any) => ({
      mcpServers: {
        ...state.mcpServers,
        [name.toLowerCase()]: cfg
      }
    }))
  },
  updateMcpServer: (name, patch) =>
    set((state: any) => {
      const current = state.mcpServers[name.toLowerCase()];
      if (!current) return state; // nothing to update

      return {
        mcpServers: {
          ...state.mcpServers,
          [name.toLowerCase()]: {
            registry: {
              ...current.registry,
            },
            config: {
              ...current.config,
              ...patch
            }
          }
        }
      };
    }),
  /** MULTI UPDATE */
  updateMcpServers: (patches: Record<string, Partial<ServerClientConfig>>) =>
    set((state: any) => {
      const updated: Record<string, ServerItem> = { ...state.mcpServers };

      for (const [name, patch] of Object.entries(patches)) {
        const current = updated[name.toLowerCase()];
        if (!current) continue;
        updated[name.toLowerCase()] = {
          registry: {
            ...current.registry!,
          },
          config: {
            ...current.config,
            ...patch
          }
        };
      }

      return { mcpServers: updated };
    }),
  reconcileAgentPluginMcpServers: (enabledPluginIds, servers) =>
    set((state: any) => {
      const next: Record<string, ServerItem> = {};
      const desiredKeys = new Set(Object.keys(servers).map((key) => key.toLowerCase()));

      for (const [key, item] of Object.entries(state.mcpServers as Record<string, ServerItem>)) {
        if (item.source?.kind === "agent-plugin") continue;
        next[key] = item;
      }

      for (const [rawKey, desired] of Object.entries(servers)) {
        const key = rawKey.toLowerCase();
        const current = (state.mcpServers as Record<string, ServerItem>)[key];
        next[key] = {
          ...desired,
          config: {
            ...desired.config,
            disabled: current?.source?.kind === "agent-plugin"
              ? current.config.disabled === true
              : desired.config.disabled === true,
          },
        };
      }

      const mcpServerContent = { ...(state.mcpServerContent ?? {}) };
      for (const [key, item] of Object.entries(state.mcpServers as Record<string, ServerItem>)) {
        if (item.source?.kind === "agent-plugin" && !desiredKeys.has(key.toLowerCase())) {
          delete mcpServerContent[key];
        }
      }

      return {
        enabledAgentPluginIds: Array.from(new Set(
          (Array.isArray(enabledPluginIds) ? enabledPluginIds : [])
            .filter((id): id is string => typeof id === "string" && id.length > 0),
        )),
        mcpServers: next,
        mcpServerContent,
      };
    }),

  removeMcpServer: (name) =>
    set((state: any) => {
      const next = { ...state.mcpServers };
      delete next[name.toLowerCase()];

      const mcpServerContent = { ...state.mcpServerContent };
      delete mcpServerContent[name.toLowerCase()];

      return { mcpServers: next, mcpServerContent };
    })
});
