// useTools.ts
import { useMemo } from "react";
import { useAppStore } from "aihappey-state";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import { localAgentsEditorPluginDef, localAgentsRuntimePluginDef } from "./toolcalls/useLocalAgentsToolCall";
import { localCanvasPluginDef } from "./toolcalls/useLocalCanvasToolCall";
import { localConversationsPluginDef } from "./toolcalls/useLocalConversationsToolCall";
import { localFilesPluginDef } from "./toolcalls/useLocalFileToolCall";
import { localSettingsPluginDef } from "./toolcalls/useLocalSettingsToolCall";
import { localToolsPluginDef } from "./toolcalls/useLocalToolsToolCall";
import { localStructuredOutputsPluginDef } from "./toolcalls/useLocalStructuredOutputsToolCall";
import { localActionsPluginDef } from "./toolcalls/useLocalActionsToolCall";
import { localCatalogPluginDef } from "./toolcalls/useLocalCatalogToolCall";
import { localRegistryPluginDef } from "./toolcalls/useLocalRegistryToolCall";
import { usePlugins } from "./toolcalls/usePlugins";
import { resourceTool } from "./toolcalls/useReadResourceToolCall";
import { vercelAIPluginDef } from "./toolcalls/useVercelAIToolCall";
import { useLocalTools } from "aihappey-tools";
import { storedToolToMcpTool } from "./localStoredTools";
import { localImagesPluginDef } from "./toolcalls/useLocalImagesToolCall";
import { localTodoPluginDef } from "./toolcalls/useLocalTodoListToolCall";
import { localJsonRenderPluginDef } from "./toolcalls/useLocalJsonRenderToolCall";
import { localWebPluginDef } from "./toolcalls/useLocalWebToolCall";
import { localChartJsPluginDef } from "./toolcalls/useLocalChartJsToolCall";
import { localArtificialIntelligencePluginDef } from "./toolcalls/useLocalArtificialIntelligenceToolCall";
import {
  buildActivateSkillTool,
  buildReadSkillResourceTool,
  buildSkillSearchPluginDef,
} from "./toolcalls/useSkillToolCall";
import { buildMcpTaskTools, mcpTaskPluginDef } from "./toolcalls/useMcpTaskToolCall";
import { localSkillEditorPluginDef } from "./toolcalls/useLocalSkillEditorToolCall";
import { clientToolSearchPluginDef } from "./toolcalls/useClientToolSearchToolCall";
import { clientResourceSearchPluginDef } from "./toolcalls/useClientResourceSearchToolCall";
import { useRuntimeSkills } from "../skills/useRuntimeSkills";
import { readPluginFileTool } from "./toolcalls/usePluginFileToolCall";
import { localAgentPluginEditorPluginDef } from "./toolcalls/useLocalAgentPluginEditorToolCall";
import {
  documentHubEditorPluginDef,
  documentHubSearchPluginDef,
} from "./toolcalls/useDocumentHubToolCalls";

export const getToolName = (type: string) => type.replace("tool-", "")

export type AttachedToolSource = {
  kind: "mcp" | "plugin" | "local";
  id: string;
  name: string;
  description?: string;
  requestOptions?: {
    allowed_callers?: Array<"direct" | "programmatic">;
    defer_loading?: boolean;
  };
  namespace?: boolean;
};

export type AttachedTool = Tool & { source: AttachedToolSource };

export type UseToolsOptions = {
  /**
   * Optional selections used to preview a tool catalog before those selections
   * are committed to the application store (for example, in a settings draft).
   */
  activePlugins?: string[];
  enabledLocalTools?: string[];
};

export function useTools(options: UseToolsOptions = {}) {
  const mcpServerContent = useAppStore(s => s.mcpServerContent);
  const mcpServers = useAppStore(s => s.mcpServers);
  const toolAnnotations = useAppStore(s => s.toolAnnotations);
  const storedActivePlugins = useAppStore(s => s.activePlugins);
  const storedEnabledLocalTools = useAppStore(s => (s as any).enabledLocalTools as string[]);

  const enabledPlugins = options.activePlugins ?? storedActivePlugins;
  const enabledLocalTools = options.enabledLocalTools ?? storedEnabledLocalTools;

  const localTools = useLocalTools();
  const runtimeSkills = useRuntimeSkills();
  const enabledSkills = runtimeSkills.enabled;

  const defsAll = useMemo(
    () => [
      localFilesPluginDef,
      localAgentsEditorPluginDef,
      localAgentsRuntimePluginDef,
      localConversationsPluginDef,
      localCanvasPluginDef,
      localJsonRenderPluginDef,
      localImagesPluginDef,
      localWebPluginDef,
      localChartJsPluginDef,
      localArtificialIntelligencePluginDef,
      localSkillEditorPluginDef,
      localAgentPluginEditorPluginDef,
      documentHubSearchPluginDef,
      documentHubEditorPluginDef,
      localTodoPluginDef,
      localSettingsPluginDef,
      localStructuredOutputsPluginDef,
      localCatalogPluginDef,
      localRegistryPluginDef,
      localActionsPluginDef,
      localToolsPluginDef,
      buildSkillSearchPluginDef(runtimeSkills.searchable),
      mcpTaskPluginDef,
      vercelAIPluginDef,
      clientToolSearchPluginDef,
      clientResourceSearchPluginDef,
    ],
    [runtimeSkills.searchable]
  );

  // We don't need runtimes here; pass empty objects.
  const { defs } = usePlugins(enabledPlugins, defsAll, {}, {});

  const injectedPluginTools = useMemo(
    () => defs.flatMap((definition: any) => (definition.tools ?? []).map((tool: Tool) => ({
      tool,
      source: {
        kind: "plugin" as const,
        id: String(definition.name ?? "plugin"),
        name: String(definition.title ?? definition.name ?? "Plugin"),
        description: definition.description,
      },
    }))),
    [defs]
  );

  const injectedStoredLocalTools = useMemo<Tool[]>(() => {
    const enabled = Array.isArray(enabledLocalTools) ? enabledLocalTools : [];
    if (enabled.length === 0) return [];

    const byId = new Map((localTools.items ?? []).map(t => [t.id, t] as const));

    const result: Tool[] = [];
    for (const id of enabled) {
      const stored = byId.get(id);
      if (!stored) continue;
      try {
        result.push(storedToolToMcpTool(stored));
      } catch {
        // ignore invalid stored tools (bad schema, etc.)
      }
    }
    return result;
  }, [enabledLocalTools, localTools.items]);

  return useMemo(() => {
    const baseTools = Object.entries(mcpServerContent).flatMap(([serverId, server]: [string, any]) =>
      (server.tools ?? []).map((tool: Tool) => ({
        tool,
        source: {
          kind: "mcp" as const,
          id: serverId,
          name: String(mcpServers[serverId]?.source?.serverName ?? server.name ?? server.title ?? serverId),
          description: mcpServers[serverId]?.source?.kind === "agent-plugin"
            ? `MCP tools provided by Agent Plugin ${mcpServers[serverId].source!.pluginName}.`
            : server.description,
          ...(mcpServers[serverId]?.source?.kind === "agent-plugin" ? {
            requestOptions: {
              ...(mcpServers[serverId].source!.allowed_callers?.length
                ? { allowed_callers: mcpServers[serverId].source!.allowed_callers }
                : {}),
              ...(mcpServers[serverId].source!.defer_loading === true ? { defer_loading: true } : {}),
            },
            namespace: mcpServers[serverId].source!.namespace === true,
          } : {}),
        },
      }))
    );
    const mcpTaskTools = buildMcpTaskTools(mcpServerContent);

    const hasResources = Object.values(mcpServerContent).some(
      s => (s.resources?.length ?? 0) > 0 || (s.resourceTemplates?.length ?? 0) > 0
    );

    // De-dupe by name with precedence: MCP/server tools > injected plugin tools > stored local tools
    const seen = new Set<string>();
    const allTools: AttachedTool[] = [];

    for (const { tool: t, source } of baseTools) {
      if (seen.has(t.name)) continue;
      seen.add(t.name);
      allTools.push({ ...t, source });
    }
    for (const { tool: t, source } of injectedPluginTools) {
      if (seen.has(t.name)) continue;
      seen.add(t.name);
      allTools.push({ ...t, source });
    }
    for (const t of injectedStoredLocalTools) {
      if (seen.has(t.name)) continue;
      seen.add(t.name);
      allTools.push({ ...t, source: { kind: "local", id: "local", name: "Local tools" } });
    }
    for (const t of mcpTaskTools) {
      if (seen.has(t.name)) continue;
      seen.add(t.name);
      allTools.push({ ...t, source: { kind: "local", id: "local", name: "Local tools" } });
    }
    if (enabledSkills.length > 0) {
      const skillTools = [
        buildActivateSkillTool(enabledSkills),
        buildReadSkillResourceTool(enabledSkills),
      ];

      for (const t of skillTools) {
        if (seen.has(t.name)) continue;
        seen.add(t.name);
        allTools.push({ ...t, source: { kind: "local", id: "local", name: "Local tools" } });
      }
    }
    if (runtimeSkills.plugins.some((plugin) => plugin.files.length > 0) && !seen.has(readPluginFileTool.name)) {
      seen.add(readPluginFileTool.name);
      allTools.push({ ...readPluginFileTool, source: { kind: "local", id: "local", name: "Local tools" } });
    }
    if (hasResources && !seen.has(resourceTool.name)) {
      allTools.push({ ...resourceTool, source: { kind: "local", id: "local", name: "Local tools" } });
    }

    // annotation gates (unchanged)
    const needsReadOnly = !!toolAnnotations?.readOnlyHint;
    const needsIdempotent = !!toolAnnotations?.idempotentHint;
    const allowDestructive = !!toolAnnotations?.destructiveHint;
    const allowOpenWorld = !!toolAnnotations?.openWorldHint;

    const enabledTools: AttachedTool[] = [];
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

    return {
      // Source metadata is client-only and ignored by ordinary tool mappers. The
      // OpenAI Responses mapper uses it to build optional namespaces.
      tools: enabledTools,
      attachedTools: enabledTools,
      disabledTools: disabledMap,
    };
  }, [
    mcpServerContent,
    mcpServers,
    injectedPluginTools,
    injectedStoredLocalTools,
    enabledSkills,
    runtimeSkills.plugins,
    toolAnnotations,
  ]);
}
