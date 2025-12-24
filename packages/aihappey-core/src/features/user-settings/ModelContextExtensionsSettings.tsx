import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { ModelContextExtensionsSettingsForm } from "aihappey-components";

export const ModelContextExtensionsSettings = () => {
  const { t } = useTranslation();

  const enableApps = useAppStore(s => s.enableApps);
  const setEnableApps = useAppStore(s => s.setEnableApps);

  const enableAgentImport = useAppStore(s => s.enableAgentImport);
  const toggleAgentImport = useAppStore(s => s.toggleAgentImport);

  const enableConversationImport = useAppStore(s => s.enableConversationImport);
  const toggleConversationImport = useAppStore(s => s.toggleConversationImport);

  return (
    <ModelContextExtensionsSettingsForm
      value={{
        enableApps,
        enableAgentImport,
        enableConversationImport,
      }}
      onToggleApps={setEnableApps}
      onToggleAgentImport={toggleAgentImport}
      onToggleConversationImport={toggleConversationImport}
      translations={{
        appsLabel: t("settingsModal.apps"),
        agentImportLabel: t("settingsModal.agentImport"),
        agentImportHint: t("settingsModal.agentImportHint"),
        conversationImportLabel: t("settingsModal.conversationImport"),
        conversationImportHint: t("settingsModal.conversationImportHint"),
      }}
    />
  );
};
