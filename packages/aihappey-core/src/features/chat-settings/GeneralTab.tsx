import {
  AiChatSettingsForm, ChatSettingsForm, LocalToolsSettingsForm,
  ProviderSettingsForm, useTheme
} from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { useChatContext } from "../chat/context/ChatContext";
import { McpPolicySettings } from "../mcp-client/McpPolicySettings";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types";
import { usePlugins } from "../tools/toolcalls/usePlugins";
import { useMemo } from "react";
import { localAgentsPluginDef } from "../tools/toolcalls/useLocalAgentsToolCall";
import { localCanvasPluginDef } from "../tools/toolcalls/useLocalCanvasToolCall";
import { localConversationsPluginDef } from "../tools/toolcalls/useLocalConversationsToolCall";
import { localFilesPluginDef } from "../tools/toolcalls/useLocalFileToolCall";
import { localSettingsPluginDef } from "../tools/toolcalls/useLocalSettingsToolCall";
import { localToolsPluginDef } from "../tools/toolcalls/useLocalToolsToolCall";
import { vercelAIPluginDef } from "../tools/toolcalls/useVercelAIToolCall";

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
  const appConfig = useChatContext();
  const toolAnnotations = useAppStore((s) => s.toolAnnotations);
  const setToolAnnotations = useAppStore((s) => s.setToolAnnotations);
  const enabledProviders = useAppStore(s => s.enabledProviders)
  const setEnabledProviders = useAppStore(s => s.setEnabledProviders)
  const activePlugins = useAppStore(s => s.activePlugins)
  const setActivePlugins = useAppStore(s => s.setActivePlugins)
  const enabledPlugins = useAppStore(s => s.activePlugins);

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

  // We don't need runtimes here; pass empty objects.
  const { defs } = usePlugins(enabledPlugins, defsAll, {}, {});

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

  const items = useMemo(
    () =>
      defsAll
        .map(d => ({
          id: d.name,
          label: t("plugins." + d.name),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [defs, t]
  );

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <AiChatSettingsForm
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
          items={items}
          value={activePlugins}
          onChange={setActivePlugins}
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