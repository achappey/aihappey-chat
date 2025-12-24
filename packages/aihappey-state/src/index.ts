import { createAppStore, RootState } from "./createAppStore";
import { useStore } from "zustand/react";

const store = createAppStore();
/** Generic selector hook for the global store. */
const useAppStore = <T>(selector: (state: RootState) => T): T =>
  useStore(store, selector);

/** Selector for remoteStorageConnected flag */
export const useRemoteStorageConnected = () =>
  useAppStore(s => (s as any).remoteStorageConnected as boolean);

export { createAppStore, useAppStore, store };

export type { Resource, ResourceTemplate, Prompt } from "aihappey-mcp";
export { SamplingRequest } from "./slices/mcpSlice";
export type { UiAttachment } from "./slices/uiSlice";
export { defaultAgents } from "./slices/defaultAgents";

export type { ServerItem } from './slices/mcpServersSlice';
export { mcpRuntime, connectPersistent, connectServerPersistent } from "./slices/uiSlice";
