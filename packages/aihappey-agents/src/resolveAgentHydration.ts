import type { Agent } from "aihappey-types";
import type { LocalAgentHydrationResult } from "./types";
import { normalizeAgent } from "./normalizeAgent";

function normalizeAgents(items?: Agent[]): Agent[] {
  if (!Array.isArray(items)) return [];

  const seenNames = new Set<string>();
  const normalized: Agent[] = [];

  for (const item of items) {
    if (!item || typeof item !== "object") continue;

    const name = typeof item.name === "string" ? item.name.trim() : "";
    if (!name || seenNames.has(name)) continue;

    seenNames.add(name);
    normalized.push(normalizeAgent({
      ...item,
      name,
    }));
  }

  return normalized;
}

export function resolveAgentHydration({
  defaults,
  indexedDb,
  legacy,
}: {
  defaults?: Agent[];
  indexedDb?: Agent[];
  legacy?: Agent[];
}): LocalAgentHydrationResult {
  const normalizedIndexedDb = normalizeAgents(indexedDb);
  if (normalizedIndexedDb.length > 0) {
    return {
      source: "indexeddb",
      agents: normalizedIndexedDb,
    };
  }

  const normalizedLegacy = normalizeAgents(legacy);
  if (normalizedLegacy.length > 0) {
    return {
      source: "legacy",
      agents: normalizedLegacy,
    };
  }

  return {
    source: "defaults",
    agents: normalizeAgents(defaults),
  };
}
