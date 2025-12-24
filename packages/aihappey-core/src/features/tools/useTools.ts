import { useMemo } from "react";
import { useAppStore } from "aihappey-state";
import { localAgentsCreateTool, localAgentsDeleteTool, localAgentsListTool } from "./toolcalls/useLocalAgentsToolCall";
import { localConversationsGetTool, localConversationsListTool, localConversationsSearchTextTool } from "./toolcalls/useLocalConversationsToolCall";
import { localSettingsGetTool, localSettingsSetTool } from "./toolcalls/useLocalSettingsToolCall";
import { resourceTool } from "./toolcalls/useReadResourceToolCall";
import type { Tool } from "@modelcontextprotocol/sdk/types";

export function useTools() {
  const mcpServerContent = useAppStore(s => s.mcpServerContent);
  const toolAnnotations = useAppStore(s => s.toolAnnotations);

  const enableLocalConversationTools = useAppStore(s => s.localConversationTools);
  const enableLocalAgentTools = useAppStore(s => s.localAgentTools);
  const localSettingsTools = useAppStore(s => s.localSettingsTools);

  return useMemo(() => {
    /* -------------------- flatten MCP tools -------------------- */
    const baseTools =
      Object.values(mcpServerContent)
        .flatMap(s => s.tools ?? []);

    /* -------------------- detect resources -------------------- */
    const hasResources = Object.values(mcpServerContent).some(
      s => (s.resources?.length ?? 0) > 0 || (s.resourceTemplates?.length ?? 0) > 0
    );

    /* -------------------- inject local tools -------------------- */
    const allTools = [
      ...baseTools,
      ...(enableLocalAgentTools
        ? [localAgentsCreateTool, localAgentsListTool, localAgentsDeleteTool]
        : []),
      ...(enableLocalConversationTools
        ? [localConversationsListTool, localConversationsGetTool, localConversationsSearchTextTool]
        : []),
      ...(localSettingsTools
        ? [localSettingsGetTool, localSettingsSetTool]
        : [])
    ];

    /* -------------------- annotation gates -------------------- */
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

      if (allowed) {
        enabledTools.push(t);
      }
    }

    return {
      tools: hasResources ? [resourceTool, ...enabledTools] : enabledTools,
      disabledTools: disabledMap
    };
  }, [
    mcpServerContent,
    toolAnnotations,
    enableLocalAgentTools,
    enableLocalConversationTools,
    localSettingsTools
  ]);
}
