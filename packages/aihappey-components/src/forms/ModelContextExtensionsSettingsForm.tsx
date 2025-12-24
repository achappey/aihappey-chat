import { useTheme } from "../theme/ThemeContext";

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
  translations?: {
    appsLabel?: string;
    agentImportLabel?: string;
    agentImportHint?: string;
    conversationImportLabel?: string;
    conversationImportHint?: string;
  };
};

export const ModelContextExtensionsSettingsForm = ({
  value,
  onToggleApps,
  onToggleAgentImport,
  onToggleConversationImport,
  translations,
}: ModelContextExtensionsSettingsFormProps) => {
  const { Switch } = useTheme();

  return (
    <>
      <Switch
        id="enableApps"
        size="small"
        checked={value.enableApps}
        label={translations?.appsLabel ?? "apps"}
        onChange={onToggleApps}
      />

      <Switch
        id="enableAgentImport"
        size="small"
        checked={value.enableAgentImport}
        label={translations?.agentImportLabel ?? "agentImport"}
        hint={translations?.agentImportHint}
        onChange={onToggleAgentImport}
      />

      <Switch
        id="enableConversationImport"
        size="small"
        checked={value.enableConversationImport}
        label={translations?.conversationImportLabel ?? "conversationImport"}
        hint={translations?.conversationImportHint}
        onChange={onToggleConversationImport}
      />
    </>
  );
};
