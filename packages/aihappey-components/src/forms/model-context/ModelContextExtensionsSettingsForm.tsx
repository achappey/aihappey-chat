import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../theme/ThemeContext";

type ModelContextExtensionsSettings = {
  enableApps: boolean;
  enableAgentImport: boolean;
  enableConversationImport: boolean;
};

type ModelContextExtensionsSettingsFormProps = {
  value: ModelContextExtensionsSettings;
  onToggleApps: (enabled: boolean) => void;
  onToggleAgentImport: (enabled: boolean) => void;
  onToggleConversationImport: (enabled: boolean) => void;
};

export const ModelContextExtensionsSettingsForm = ({
  value,
  onToggleApps,
  onToggleAgentImport,
  onToggleConversationImport,
}: ModelContextExtensionsSettingsFormProps) => {
  const { Switch } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <Switch
        id="enableApps"
        size="small"
        checked={value.enableApps}
        label={t("settingsModal.apps")}
        onChange={onToggleApps}
      />

      <Switch
        id="enableAgentImport"
        size="small"
        checked={value.enableAgentImport}
        label={t("settingsModal.agentImport")}
        hint={t("settingsModal.agentImportHint")}
        onChange={onToggleAgentImport}
      />

      <Switch
        id="enableConversationImport"
        size="small"
        checked={value.enableConversationImport}
        label={t("settingsModal.conversationImport")}
        hint={t("settingsModal.conversationImportHint")}
        onChange={onToggleConversationImport}
      />
    </>
  );
};
