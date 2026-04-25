import { del, get, set } from "idb-keyval";
import type { Agent } from "aihappey-types";
import type { LocalAgentStore } from "./types";

const DB_KEY = "aihappey_agents_v1";

function normalizeAgents(items?: Agent[]): Agent[] {
  if (!Array.isArray(items)) return [];

  const seenNames = new Set<string>();
  const normalized: Agent[] = [];

  for (const item of items) {
    if (!item || typeof item !== "object") continue;

    const name = typeof item.name === "string" ? item.name.trim() : "";
    if (!name || seenNames.has(name)) continue;

    seenNames.add(name);
    normalized.push({
      ...item,
      name,
    });
  }

  return normalized;
}

async function load(): Promise<Agent[]> {
  if (typeof window === "undefined") return [];

  try {
    return normalizeAgents((await get(DB_KEY)) as Agent[] | undefined);
  } catch {
    return [];
  }
}

async function save(items: Agent[]): Promise<Agent[]> {
  const normalized = normalizeAgents(items);

  if (typeof window !== "undefined") {
    await set(DB_KEY, normalized);
  }

  return normalized;
}

export class IndexedDBAgentStore implements LocalAgentStore {
  readonly kind = "indexeddb" as const;

  list = async (): Promise<Agent[]> => {
    return load();
  };

  replaceAll = async (agents: Agent[]): Promise<Agent[]> => {
    return save(agents);
  };

  clear = async (): Promise<void> => {
    if (typeof window === "undefined") return;
    await del(DB_KEY);
  };

  isEmpty = async (): Promise<boolean> => {
    const items = await this.list();
    return items.length === 0;
  };
}
