import { createStore } from "zustand";
import { createChatSlice, type ChatSlice } from "./slices/chatSlice";
import { createMcpSlice, type McpSlice } from "./slices/mcpSlice";
import { createUiSlice, type UiSlice } from "./slices/uiSlice";
import { withPersist } from "./persist";
import { AgentSlice, createAgentSlice } from "./slices/agentSlice";
import { createMcpServersSlice, McpServersSlice } from "./slices/mcpServersSlice";
import { createMcpRegistrySlice, McpRegistrySlice } from "./slices/mcpRegistrySlice";
import { createImageSlice, ImageSlice } from "./slices/imageSlice";

export type RootState = ChatSlice & McpSlice & ImageSlice
  & UiSlice & AgentSlice & McpServersSlice & McpRegistrySlice;

export const createAppStore = () =>
  createStore<RootState, [["zustand/persist", unknown]]>(
    withPersist(
      (set, get, store) => ({
        ...createChatSlice(set, get, store),
        ...createAgentSlice(set, get, store),
        ...createImageSlice(set, get, store),
        ...createMcpServersSlice(set, get, store),
        ...createMcpRegistrySlice(set, get, store),
        ...createMcpSlice(set, get, store),
        ...createUiSlice(set, get, store),
      })
    )
  );
