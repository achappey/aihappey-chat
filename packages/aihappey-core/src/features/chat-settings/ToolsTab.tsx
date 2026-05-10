import { LocalToolsSettingsForm, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useMemo } from "react";
import { useLocalTools } from "aihappey-tools";
import { localAgentsPluginDef } from "../tools/toolcalls/useLocalAgentsToolCall";
import { localCanvasPluginDef } from "../tools/toolcalls/useLocalCanvasToolCall";
import { localConversationsPluginDef } from "../tools/toolcalls/useLocalConversationsToolCall";
import { localFilesPluginDef } from "../tools/toolcalls/useLocalFileToolCall";
import { localSettingsPluginDef } from "../tools/toolcalls/useLocalSettingsToolCall";
import { localToolsPluginDef } from "../tools/toolcalls/useLocalToolsToolCall";
import { localStructuredOutputsPluginDef } from "../tools/toolcalls/useLocalStructuredOutputsToolCall";
import { vercelAIPluginDef } from "../tools/toolcalls/useVercelAIToolCall";
import { isStoredToolValid } from "../tools/localStoredTools";
import { localImagesPluginDef } from "../tools/toolcalls/useLocalImagesToolCall";
import { localJsonRenderPluginDef } from "../tools/toolcalls/useLocalJsonRenderToolCall";
import { localCatalogPluginDef } from "../tools/toolcalls/useLocalCatalogToolCall";
import { localRegistryPluginDef } from "../tools/toolcalls/useLocalRegistryToolCall";
import { localTodoPluginDef } from "../tools/toolcalls/useLocalTodoListToolCall";
import { localWebPluginDef } from "../tools/toolcalls/useLocalWebToolCall";
import { localChartJsPluginDef } from "../tools/toolcalls/useLocalChartJsToolCall";
import { localArtificialIntelligencePluginDef } from "../tools/toolcalls/useLocalArtificialIntelligenceToolCall";
import { localSkillEditorPluginDef } from "../tools/toolcalls/useLocalSkillEditorToolCall";
import { SKILL_SEARCH_PLUGIN_ID } from "../tools/toolcalls/useSkillToolCall";

// --- Tools Tab ---
// Holds the "Lokale plugins" card previously shown in the General tab.
export const ToolsTab = ({
  activePlugins,
  setActivePlugins,
  enabledLocalTools,
  setEnabledLocalTools,
}: {
  activePlugins: string[];
  setActivePlugins: (value: string[]) => void;
  enabledLocalTools: string[];
  setEnabledLocalTools: (value: string[]) => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const localTools = useLocalTools();
  const defsAll = useMemo(
    () => [
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
      localStructuredOutputsPluginDef,
      localCatalogPluginDef,
      localRegistryPluginDef,
      localToolsPluginDef,
      vercelAIPluginDef,
    ],
    []
  );

  const items = useMemo(
    () =>
      [
        ...defsAll.map((d) => ({
          id: d.name,
          label: t("plugins." + d.name),
        })),
        {
          id: SKILL_SEARCH_PLUGIN_ID,
          label: t("plugins." + SKILL_SEARCH_PLUGIN_ID) ?? "Skill search",
        },
      ]
        
        .sort((a, b) => a.label.localeCompare(b.label)),
    [defsAll, t]
  );

  const localToolItems = useMemo(() => {
    const list = (localTools.items ?? [])
      .map((it) => {
        const valid = isStoredToolValid(it);
        return {
          id: it.id,
          label: valid ? it.id : `${it.id} (invalid)`,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
    return list;
  }, [localTools.items]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <LocalToolsSettingsForm
        formTitle={t("localPlugins")}
        items={items}
        value={activePlugins}
        onChange={setActivePlugins}
      />

      {localToolItems.length > 0 ? (
        <LocalToolsSettingsForm
          formTitle={t("localTools")}
          items={localToolItems}
          value={enabledLocalTools}
          onChange={setEnabledLocalTools}
          columns={2}
        />
      ) : (
        <theme.Card
          size={"small"}
          title={t("localTools")}
        >
          {t("localToolsEmpty")}
        </theme.Card>
      )}
    </div>
  );
};

