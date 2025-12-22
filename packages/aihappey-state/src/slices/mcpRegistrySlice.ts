import type { McpRegistryServerResponse } from "aihappey-types";
import type { StateCreator } from "zustand";


export type McpRegistrySlice = {
  mcpRegistries: Record<string, McpRegistryServerResponse[]>;
  addMcpRegistry: (url: string, cfg: McpRegistryServerResponse[]) => void;
  removeMcpRegistry: (url: string) => void;
};

export const createMcpRegistrySlice: StateCreator<
  any,
  [],
  [],
  McpRegistrySlice
> = (set, get, store) => ({
  mcpRegistries: {},
  addMcpRegistry: (url, cfg) =>
    set((state: any) => ({
      mcpRegistries: {
        ...state.mcpRegistries,
        [url]: cfg
      }
    })),

  removeMcpRegistry: (url) =>
    set((state: any) => {
      const next = { ...state.mcpRegistries };
      delete next[url];
      return { mcpRegistries: next };
    })
});
