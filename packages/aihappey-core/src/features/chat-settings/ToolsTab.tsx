import { LocalToolsSettingsForm, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useMemo } from "react";
import { useLocalTools } from "aihappey-tools";
import { buildLocalToolToggleItems, usePluginToggleItems } from "../tools/toolCatalogItems";

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
  const items = usePluginToggleItems({ includeSkillSearch: true, settingsScope: true });

  const localToolItems = useMemo(() => {
    return buildLocalToolToggleItems(localTools.items ?? [], t);
  }, [localTools.items, t]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <LocalToolsSettingsForm
        formTitle={t("builtInLocalTools") ?? "Local tools"}
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

