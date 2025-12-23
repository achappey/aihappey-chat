import { AiSettingsForm, ChatSettingsForm, LocalToolsSettingsForm, ProviderSettingsForm, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { useChatContext } from "../chat/context/ChatContext";
import { McpPolicySettings } from "../mcp-client/McpPolicySettings";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types";

// --- General Tab ---
export const GeneralTab = ({
  temperature,
  setTemperature,
  onEditProviderKeys
}: any) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const setStructuredOutputs = useAppStore(a => a.setStructuredOutputs)
  const structuredOutputs = useAppStore(a => a.structuredOutputs)
  const publishers = Object.entries(PROVIDERS).map(a => a[1].name).sort();
  const setThrottle = useAppStore((s) => s.setThrottle);
  const experimentalThrottle = useAppStore((s) => s.experimentalThrottle);
  const localAgentTools = useAppStore((s) => s.localAgentTools);
  const localConversationTools = useAppStore((s) => s.localConversationTools);
  const localSettingsTools = useAppStore((s) => s.localSettingsTools);
  const localMcpTools = useAppStore((s) => s.localMcpTools);
  const setLocalAgentTools = useAppStore((s) => s.setLocalAgentTools);
  const setLocalConversationTools = useAppStore((s) => s.setLocalConversationTools);
  const setLocalSettingsTools = useAppStore((s) => s.setLocalSettingsTools);
  const setLocalMcpTools = useAppStore((s) => s.setLocalMcpTools);
  const appConfig = useChatContext();
  const toolAnnotations = useAppStore((s) => s.toolAnnotations);
  const setToolAnnotations = useAppStore((s) => s.setToolAnnotations);
  const enabledProviders = useAppStore(s => s.enabledProviders)
  const setEnabledProviders = useAppStore(s => s.setEnabledProviders)

  const onToggle = (key: keyof ToolAnnotations) =>
    setToolAnnotations({
      ...(toolAnnotations ?? {}),
      [key]: !toolAnnotations?.[key],
    });

  const aiSettings = {
    temperature: temperature
  };

  const aiSettingTranslations = {
    temperature: t("temperature")
  };

  const chatSettingTranslations = {
    throttle: t("throttle")
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <AiSettingsForm
          value={aiSettings}
          translations={aiSettingTranslations}
          formTitle={t("ai.title")}
          onChange={(val) => setTemperature(val.temperature)} />

        <ChatSettingsForm
          value={{ throttle: experimentalThrottle ?? 100 }}
          translations={chatSettingTranslations}
          formTitle={t("chat")}
          onChange={(val) => setThrottle(val.throttle)} />

        <McpPolicySettings
          policySettings={toolAnnotations}
          toggle={onToggle} />

        <ProviderSettingsForm
          providers={publishers}
          enabledProviders={enabledProviders}
          onChange={setEnabledProviders} // or your own setter
          formTitle={t("providers")}
          headerActions={
            !appConfig.config.getAccessToken ? (
              <theme.Button
                size="small"
                variant="transparent"
                onClick={onEditProviderKeys}
                icon="edit"
              />
            ) : undefined
          }
        />

        <LocalToolsSettingsForm
          formTitle={t("localTools")}
          translations={{
            localConversations: t("localConversations"),
            localSettings: t("localSettings"),
            localAgents: t("localAgents"),
            localMcps: t("localMcps"),
          }}
          value={{
            localConversationTools,
            localSettingsTools,
            localAgentTools,
            localMcpTools,
          }}
          onChange={(next) => {
            setLocalConversationTools(next.localConversationTools ?? false);
            setLocalSettingsTools(next.localSettingsTools ?? false);
            setLocalAgentTools(next.localAgentTools ?? false);
            setLocalMcpTools(next.localMcpTools ?? false);
          }}
        />

        <theme.TextArea
          label={t("structuredOutputs")}
          placeholder={t("structuredOutputsPlaceholder")}
          rows={5}
          value={structuredOutputs ? JSON.stringify(structuredOutputs) : ""}
          onChange={(value) => {
            setStructuredOutputs(value && value.length > 0 ? {
              ...JSON.parse(value),
            } : undefined);
          }}></theme.TextArea>
      </div>
   
    </>
  );
};