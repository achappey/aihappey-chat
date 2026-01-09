import { LocalToolsSettingsForm, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { useMemo } from "react";
import { useLocalTools } from "aihappey-tools";
import { localAgentsPluginDef } from "../tools/toolcalls/useLocalAgentsToolCall";
import { localCanvasPluginDef } from "../tools/toolcalls/useLocalCanvasToolCall";
import { localConversationsPluginDef } from "../tools/toolcalls/useLocalConversationsToolCall";
import { localFilesPluginDef } from "../tools/toolcalls/useLocalFileToolCall";
import { localSettingsPluginDef } from "../tools/toolcalls/useLocalSettingsToolCall";
import { localToolsPluginDef } from "../tools/toolcalls/useLocalToolsToolCall";
import { vercelAIPluginDef } from "../tools/toolcalls/useVercelAIToolCall";
import { isStoredToolValid } from "../tools/localStoredTools";

// --- Tools Tab ---
// Holds the "Lokale plugins" card previously shown in the General tab.
export const ToolsTab = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const activePlugins = useAppStore((s) => s.activePlugins);
  const setActivePlugins = useAppStore((s) => s.setActivePlugins);

  // NOTE: RootState typing comes from the built `aihappey-state` package.
  // When working in-repo without rebuilding, newly added fields may not exist in .d.ts yet.
  const enabledLocalTools = useAppStore((s) => (s as any).enabledLocalTools as string[]);
  const setEnabledLocalTools = useAppStore(
    (s) => (s as any).setEnabledLocalTools as (names: string[]) => void
  );

  const localTools = useLocalTools();

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

  const items = useMemo(
    () =>
      defsAll
        .map((d) => ({
          id: d.name,
          label: t("plugins." + d.name),
        }))
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

