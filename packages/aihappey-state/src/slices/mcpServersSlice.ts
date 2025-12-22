import { McpRegistryServerResponse, ServerClientConfig } from "aihappey-types";
import type { StateCreator } from "zustand";

export type ServerItem = {
  config: ServerClientConfig;
  registry?: McpRegistryServerResponse;
};

export type McpServersSlice = {
  mcpServers: Record<string, ServerItem>;
  addMcpServer: (name: string, cfg: ServerItem) => void;
  updateMcpServer: (name: string, cfg: ServerClientConfig) => void;
  removeMcpServer: (name: string) => void;
  updateMcpServers: (patches: Record<string, Partial<ServerClientConfig>>) => any
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

  removeMcpServer: (name) =>
    set((state: any) => {
      const next = { ...state.mcpServers };
      delete next[name.toLowerCase()];

      const mcpServerContent = { ...state.mcpServerContent };
      delete mcpServerContent[name.toLowerCase()];

      return { mcpServers: next, mcpServerContent };
    })
});
