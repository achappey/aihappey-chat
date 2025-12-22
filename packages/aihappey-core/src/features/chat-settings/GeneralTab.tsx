import { useMemo, useState } from "react";
import { useTheme } from "aihappey-components";

import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { useChatContext } from "../chat/context/ChatContext";
import { ProviderKeysModal } from "../provider-credentials/ProviderKeysModal";
import { McpPolicySettings } from "../mcp-client/McpPolicySettings";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types";

// --- General Tab ---
export const GeneralTab = ({
  temperature,
  setTemperature,
}: any) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const setStructuredOutputs = useAppStore(a => a.setStructuredOutputs)
  const structuredOutputs = useAppStore(a => a.structuredOutputs)
  const publishers = Object.entries(PROVIDERS).map(a => a[1].name).sort();
  //  const toggle = (key: keyof ToolAnnotations) =>
  //    setToolAnnotations({ ...toolAnnotations, [key]: !toolAnnotations[key] });
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
  const [showProviderKeys, setShowProviderKeys] = useState(false);
  const toolAnnotations = useAppStore((s) => s.toolAnnotations);
  const setToolAnnotations = useAppStore((s) => s.setToolAnnotations);
  const onToggle = (key: keyof ToolAnnotations) =>
    setToolAnnotations({
      ...(toolAnnotations ?? {}),
      [key]: !toolAnnotations?.[key],
    });


  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <theme.Card size="small" title={t("ai.title")}>
          <div>
            <theme.Slider
              label={t("temperature") + ` (${temperature})`}
              min={0}
              max={1}
              step={0.01}
              value={temperature}
              onChange={(val: number) => setTemperature(val)}
            />
          </div>
        </theme.Card>

        <theme.Card size="small" title={t("chat")}>
          <div>
            <theme.Slider
              label={t("throttle") + ` (${experimentalThrottle} ms)`}
              min={0}
              max={1000}
              step={10}
              value={experimentalThrottle ?? 0}
              onChange={(val: number) => setThrottle(val)}
            />
          </div>
        </theme.Card>

        <McpPolicySettings
          policySettings={toolAnnotations}
          toggle={onToggle} />

        <theme.Card size="small"
          headerActions={<>
            {!appConfig.config.getAccessToken
              && <theme.Button size="small"
                variant="transparent"
                onClick={() => setShowProviderKeys(true)}
                icon="edit"></theme.Button>}
          </>}
          title={t("providers")}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              alignItems: "center",
            }}
          >
            {publishers?.map((provider) => (
              <ProviderToggle key={provider} provider={provider!} />
            ))}
          </div>
        </theme.Card>

        <theme.Card size="small" title={t("localTools")}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            alignItems: "center",
          }}>
            <theme.Switch
              id={`localConversations`}
              label={t("localConversations")}
              checked={localConversationTools ?? false}
              onChange={() => setLocalConversationTools(!(localConversationTools ?? false))}
            />
            <theme.Switch
              id={`localSettings`}
              label={t("localSettings")}
              checked={localSettingsTools ?? false}
              onChange={() => setLocalSettingsTools(!(localSettingsTools ?? false))}
            />
            <theme.Switch
              id={`localAgents`}
              label={t("localAgents")}
              checked={localAgentTools ?? false}
              onChange={() => setLocalAgentTools(!(localAgentTools ?? false))}
            />
            <theme.Switch
              id={`localMcps`}
              label={t("localMcps")}
              checked={localMcpTools ?? false}
              onChange={() => setLocalMcpTools(!(localMcpTools ?? false))}
            />
          </div>
        </theme.Card>

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
      <ProviderKeysModal open={showProviderKeys} onClose={() => setShowProviderKeys(false)} />
    </>
  );
};

const ProviderToggle = ({ provider }: { provider: string }) => {
  const theme = useTheme()
  const enabledProviders = useAppStore(s => s.enabledProviders)
  const toggleEnabledProvider = useAppStore(s => s.toggleEnabledProvider)

  const checked = enabledProviders.includes(provider)

  return (
    <theme.Switch
      id={`provider-${provider}`}
      label={provider}
      size="small"
      checked={checked}
      onChange={() => toggleEnabledProvider(provider)}
    />
  )
}