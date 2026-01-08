// useTools.ts
import { useMemo } from "react";
import { useAppStore } from "aihappey-state";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import { localAgentsPluginDef } from "./toolcalls/useLocalAgentsToolCall";
import { localCanvasPluginDef } from "./toolcalls/useLocalCanvasToolCall";
import { localConversationsPluginDef } from "./toolcalls/useLocalConversationsToolCall";
import { localFilesPluginDef } from "./toolcalls/useLocalFileToolCall";
import { localSettingsPluginDef } from "./toolcalls/useLocalSettingsToolCall";
import { localToolsPluginDef } from "./toolcalls/useLocalToolsToolCall";
import { usePlugins } from "./toolcalls/usePlugins";
import { resourceTool } from "./toolcalls/useReadResourceToolCall";
import { vercelAIPluginDef } from "./toolcalls/useVercelAIToolCall";

export const getToolName = (type: string) => type.replace("tool-", "")

export function useTools() {
  const mcpServerContent = useAppStore(s => s.mcpServerContent);
  const toolAnnotations = useAppStore(s => s.toolAnnotations);
  const enabledPlugins = useAppStore(s => s.activePlugins);

  const defsAll = useMemo(
    () => [
      localFilesPluginDef,
      localAgentsPluginDef,
      localConversationsPluginDef,
      localCanvasPluginDef,
      localSettingsPluginDef,
      localToolsPluginDef,
      vercelAIPluginDef,
    ],
    []
  );

  // We don't need runtimes here; pass empty objects.
  const { defs } = usePlugins(enabledPlugins, defsAll, {}, {});

  const injectedLocalTools = useMemo(
    () => defs.flatMap((d: any) => d.tools ?? []),
    [defs]
  );

  return useMemo(() => {
    const baseTools = Object.values(mcpServerContent).flatMap(s => s.tools ?? []);

    const hasResources = Object.values(mcpServerContent).some(
      s => (s.resources?.length ?? 0) > 0 || (s.resourceTemplates?.length ?? 0) > 0
    );

    const allTools: Tool[] = [
      ...baseTools,
      ...injectedLocalTools,
      ...(hasResources ? [resourceTool] : []), // ✅ conditional injection
    ];

    // annotation gates (unchanged)
    const needsReadOnly = !!toolAnnotations?.readOnlyHint;
    const needsIdempotent = !!toolAnnotations?.idempotentHint;
    const allowDestructive = !!toolAnnotations?.destructiveHint;
    const allowOpenWorld = !!toolAnnotations?.openWorldHint;

    const enabledTools: Tool[] = [];
    const disabledMap: Record<string, string[]> = {};

    for (const t of allTools) {
      const a = t.annotations ?? {};
      const ro = !!a.readOnlyHint;

      let allowed = true;

      if (needsReadOnly && !a.readOnlyHint) {
        (disabledMap.requiresReadOnlyDisabled ??= []).push(t.name);
        allowed = false;
      }

      if (!ro) {
        if (needsIdempotent && !a.idempotentHint) {
          (disabledMap.requiresIdempotentDisabled ??= []).push(t.name);
          allowed = false;
        }

        if (a.destructiveHint && !allowDestructive) {
          (disabledMap.destructiveNotAllowed ??= []).push(t.name);
          allowed = false;
        }
      }

      if (a.openWorldHint && !allowOpenWorld) {
        (disabledMap.openWorldNotAllowed ??= []).push(t.name);
        allowed = false;
      }

      if (allowed) enabledTools.push(t);
    }

    return { tools: enabledTools, disabledTools: disabledMap };
  }, [mcpServerContent, injectedLocalTools, toolAnnotations]);
}
