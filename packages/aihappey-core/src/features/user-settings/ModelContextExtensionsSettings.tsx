import { useTheme } from "aihappey-components";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";

export const ModelContextExtensionsSettings = () => {
  const { Switch } = useTheme();
  const setEnableApps = useAppStore((s) => s.setEnableApps);
  const enableApps = useAppStore((s) => s.enableApps);
  const toggleAgentImport = useAppStore((s) => s.toggleAgentImport);
  const enableAgentImport = useAppStore((s) => s.enableAgentImport);
  const toggleConversationImport = useAppStore((s) => s.toggleConversationImport);
  const enableConversationImport = useAppStore((s) => s.enableConversationImport);
  const { t } = useTranslation(); // Uncomment when i18n is ready

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: "24px 0 0 0",
      }}
    >
      <Switch
        id="enableApps"
        checked={enableApps}
        size="small"
        label={t("settingsModal.apps")}
        onChange={setEnableApps}
      />
      <Switch
        id="enableAgentImport"
        checked={enableAgentImport}
        size="small"
        hint={t("settingsModal.agentImportHint")}
        label={t("settingsModal.agentImport")}
        onChange={toggleAgentImport}
      />
      <Switch
        id="enableConversationImport"
        checked={enableConversationImport}
        size="small"
        hint={t("settingsModal.conversationImportHint")}
        label={t("settingsModal.conversationImport")}
        onChange={toggleConversationImport}
      />
    </div>
  );
};