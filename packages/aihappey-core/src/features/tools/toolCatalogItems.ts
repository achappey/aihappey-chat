import { useMemo } from "react";
import { useTranslation } from "aihappey-i18n";
import { isStoredToolValid, parseStoredToolInputSchema } from "./localStoredTools";
import { localFilesPluginDef } from "./toolcalls/useLocalFileToolCall";
import { localAgentsPluginDef } from "./toolcalls/useLocalAgentsToolCall";
import { localConversationsPluginDef } from "./toolcalls/useLocalConversationsToolCall";
import { localCanvasPluginDef } from "./toolcalls/useLocalCanvasToolCall";
import { localSettingsPluginDef } from "./toolcalls/useLocalSettingsToolCall";
import { localToolsPluginDef } from "./toolcalls/useLocalToolsToolCall";
import { localActionsPluginDef } from "./toolcalls/useLocalActionsToolCall";
import { localCatalogPluginDef } from "./toolcalls/useLocalCatalogToolCall";
import { localRegistryPluginDef } from "./toolcalls/useLocalRegistryToolCall";
import { localStructuredOutputsPluginDef } from "./toolcalls/useLocalStructuredOutputsToolCall";
import { vercelAIPluginDef } from "./toolcalls/useVercelAIToolCall";
import { localWebPluginDef } from "./toolcalls/useLocalWebToolCall";
import { localChartJsPluginDef } from "./toolcalls/useLocalChartJsToolCall";
import { localArtificialIntelligencePluginDef } from "./toolcalls/useLocalArtificialIntelligenceToolCall";
import { localSkillEditorPluginDef } from "./toolcalls/useLocalSkillEditorToolCall";
import { localImagesPluginDef } from "./toolcalls/useLocalImagesToolCall";
import { localJsonRenderPluginDef } from "./toolcalls/useLocalJsonRenderToolCall";
import { localTodoPluginDef } from "./toolcalls/useLocalTodoListToolCall";
import { SKILL_SEARCH_PLUGIN_ID } from "./toolcalls/useSkillToolCall";
import { clientToolSearchPluginDef } from "./toolcalls/useClientToolSearchToolCall";
import { clientResourceSearchPluginDef } from "./toolcalls/useClientResourceSearchToolCall";
import { localAgentPluginEditorPluginDef } from "./toolcalls/useLocalAgentPluginEditorToolCall";

export type ToolListItem = {
  key: string;
  name: string;
  title?: string;
  description?: string;
  inputSchema?: any;
  executeSource?: string;
  source: "plugin" | "local" | "model-context";
  sourceDetail?: string;
  enabled?: boolean;
  annotations?: any;
};

export type ToggleCatalogItem = {
  id: string;
  label: string;
};

export const normalizeCatalogText = (v: unknown) =>
  String(v ?? "").trim().toLowerCase();

export const allBuiltInPluginDefs = [
  localFilesPluginDef,
  localAgentsPluginDef,
  localConversationsPluginDef,
  localCanvasPluginDef,
  localSettingsPluginDef,
  localImagesPluginDef,
  localJsonRenderPluginDef,
  localTodoPluginDef,
  localWebPluginDef,
  localChartJsPluginDef,
  localArtificialIntelligencePluginDef,
  localSkillEditorPluginDef,
  localAgentPluginEditorPluginDef,
  localStructuredOutputsPluginDef,
  localCatalogPluginDef,
  localRegistryPluginDef,
  localActionsPluginDef,
  localToolsPluginDef,
  clientToolSearchPluginDef,
  clientResourceSearchPluginDef,
  vercelAIPluginDef,
];

export const chatSettingsPluginDefs = allBuiltInPluginDefs.filter(
  (def) => def.name !== localActionsPluginDef.name
);

export function usePluginToggleItems(options?: { includeSkillSearch?: boolean; settingsScope?: boolean }) {
  const { t } = useTranslation();
  const defs = options?.settingsScope ? chatSettingsPluginDefs : allBuiltInPluginDefs;

  return useMemo(() => {
    const items = defs.map((d) => ({
      id: d.name,
      label: t("plugins." + d.name),
    }));

    if (options?.includeSkillSearch) {
      items.push({
        id: SKILL_SEARCH_PLUGIN_ID,
        label: t("plugins." + SKILL_SEARCH_PLUGIN_ID) ?? "Skill search",
      });
    }

    return items.sort((a, b) => a.label.localeCompare(b.label));
  }, [defs, options?.includeSkillSearch, t]);
}

export function buildLocalToolToggleItems(localTools: any[], t: (key: string) => string): ToggleCatalogItem[] {
  return (localTools ?? [])
    .map((it) => {
      const valid = isStoredToolValid(it);
      return {
        id: it.id,
        label: valid ? (it.title || it.id) : `${it.title || it.id} (${t("invalid") ?? "invalid"})`,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function buildPluginToolItems(args: {
  activePlugins: string[];
  t: (key: string) => string;
  collator: Intl.Collator;
}) {
  const enabledSet = new Set(Array.isArray(args.activePlugins) ? args.activePlugins : []);
  const items: ToolListItem[] = [];

  for (const def of allBuiltInPluginDefs) {
    for (const tool of def.tools ?? []) {
      const translatedPluginName = args.t(`plugins.${def.name}`);
      items.push({
        key: `plugin:${def.name}:${tool.name}`,
        name: tool.name,
        title: (tool as any).title,
        description: (tool as any).description,
        inputSchema: (tool as any).inputSchema,
        annotations: (tool as any).annotations,
        source: "plugin",
        sourceDetail:
          translatedPluginName !== `plugins.${def.name}`
            ? translatedPluginName
            : def.name,
        enabled: enabledSet.has(def.name),
      });
    }
  }

  items.sort((a, b) =>
    args.collator.compare(
      `${a.sourceDetail ?? ""} ${a.title ?? a.name}`,
      `${b.sourceDetail ?? ""} ${b.title ?? b.name}`
    )
  );
  return items;
}

export function buildLocalToolItems(args: {
  localTools: any[];
  enabledLocalTools: string[];
  t: (key: string) => string;
  collator: Intl.Collator;
}): ToolListItem[] {
  const enabledSet = new Set(Array.isArray(args.enabledLocalTools) ? args.enabledLocalTools : []);
  const items = (args.localTools ?? []).map((stored) => {
    let schema: any = undefined;
    try {
      schema = parseStoredToolInputSchema(stored);
    } catch {
      schema = undefined;
    }

    return {
      key: `local:${stored.id}`,
      name: stored.id,
      title: stored.title,
      description: stored.description,
      inputSchema: schema,
      executeSource: stored.execute,
      source: "local" as const,
      sourceDetail: args.t("customTools"),
      enabled: enabledSet.has(stored.id),
    };
  });

  items.sort((a, b) => args.collator.compare(a.title ?? a.name, b.title ?? b.name));
  return items;
}

export function buildModelContextToolSections(args: {
  mcpServerContent: any;
  collator: Intl.Collator;
}) {
  const servers = args.mcpServerContent ?? {};
  const keys = Object.keys(servers).sort(args.collator.compare);

  const out: Array<{ serverKey: string; serverTitle: string; tools: ToolListItem[] }> = [];
  for (const serverKey of keys) {
    const server = servers[serverKey];
    const tools = Array.isArray(server?.tools) ? server.tools : [];

    const items: ToolListItem[] = tools.map((tool: any) => ({
      key: `mcp:${serverKey}:${tool.name}`,
      name: tool.name,
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema,
      annotations: tool.annotations,
      source: "model-context" as const,
      sourceDetail: serverKey,
      enabled: true,
    }));

    items.sort((a, b) => args.collator.compare(a.title ?? a.name, b.title ?? b.name));
    out.push({ serverKey, serverTitle: serverKey, tools: items });
  }

  return out;
}

