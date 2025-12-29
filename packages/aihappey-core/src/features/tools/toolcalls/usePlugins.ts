// usePlugins.ts
import { useMemo } from "react";
import type { Tool } from "@modelcontextprotocol/sdk/types";

export type ToolPluginDef = {
  name: string;
  match: (toolName: string) => boolean;
  tools?: Tool[];
};

export type ToolPluginRuntime = {
  name: string;
  handle: (toolCall: any, signal?: AbortSignal) => Promise<any>;
};

export type ToolPlugin = ToolPluginDef & ToolPluginRuntime;

export function usePlugins(
  enabledPluginNames: string[],
  defsAll: ToolPluginDef[],
  runtimes: Record<string, ToolPluginRuntime>,
  specialRuntimes: Record<string, ToolPluginRuntime>
) {
  const defs = useMemo(
    () => defsAll.filter(d => enabledPluginNames.includes(d.name)),
    [defsAll, enabledPluginNames]
  );

  const plugins = useMemo<ToolPlugin[]>(
    () =>
      defs
        .map(d => {
          const r = runtimes[d.name];
          if (!r) return null; // ignore missing runtime
          return { ...d, ...r };
        })
        .filter(Boolean) as ToolPlugin[],
    [defs, runtimes]
  );

  return { defs, plugins, specialRuntimes };
}
