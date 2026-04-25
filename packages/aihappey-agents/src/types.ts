import type { Agent } from "aihappey-types";

export type LocalAgentHydrationSource = "indexeddb" | "legacy" | "defaults";

export interface LocalAgentHydrationResult {
  source: LocalAgentHydrationSource;
  agents: Agent[];
}

export interface LocalAgentStore {
  readonly kind: "indexeddb";
  list(): Promise<Agent[]>;
  replaceAll(agents: Agent[]): Promise<Agent[]>;
  clear(): Promise<void>;
  isEmpty(): Promise<boolean>;
}
