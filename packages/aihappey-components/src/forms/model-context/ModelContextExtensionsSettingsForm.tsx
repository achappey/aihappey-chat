import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../theme/ThemeContext";

type ModelContextExtensionsSettings = {
  enableApps: boolean;
  enableAgentImport: boolean;
  enableConversationImport: boolean;
  enableMcpSkills?: boolean;
};

type ModelContextExtensionsSettingsFormProps = {
  value: ModelContextExtensionsSettings;
  onToggleApps: (enabled: boolean) => void;
  onToggleAgentImport: (enabled: boolean) => void;
  onToggleConversationImport: (enabled: boolean) => void;
  onToggleMcpSkills?: (enabled: boolean) => void;
};

export const ModelContextExtensionsSettingsForm = ({
  value,
  onToggleApps,
  onToggleAgentImport,
  onToggleConversationImport,
  onToggleMcpSkills,
}: ModelContextExtensionsSettingsFormProps) => {
  const { Card, Switch } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <Card size="small" title={t("settingsModal.officialExtensions")}>
        <div style={{ display: "grid", gap: 12 }}>
      <Switch
        id="enableApps"
        size="small"
        checked={value.enableApps}
        label={t("settingsModal.apps")}
        onChange={onToggleApps}
      />
          <Switch
            id="enableMcpSkills"
            size="small"
            checked={value.enableMcpSkills !== false}
            disabled={!onToggleMcpSkills}
            label={t("skills")}
            hint={t("settingsModal.mcpSkillsHint")}
            onChange={enabled => onToggleMcpSkills?.(enabled)}
          />
        </div>
      </Card>
      <Card size="small" title={t("custom")}>
        <div style={{ display: "grid", gap: 12 }}>
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
        </div>
      </Card>
    </>
  );
};
