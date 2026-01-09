import {
  AiChatSettingsForm, AiChatToolsSettingsForm, ChatSettingsForm,
  McpPolicySettings,
  useTheme
} from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types";
import { useMemo } from "react";
import { useTools } from "../tools/useTools";

// --- General Tab ---
export const GeneralTab = ({
  temperature,
  setTemperature }: any) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const setStructuredOutputs = useAppStore(a => a.setStructuredOutputs)
  const structuredOutputs = useAppStore(a => a.structuredOutputs)
  const setThrottle = useAppStore((s) => s.setThrottle);
  const experimentalThrottle = useAppStore((s) => s.experimentalThrottle);
  const toolAnnotations = useAppStore((s) => s.toolAnnotations);
  const setToolAnnotations = useAppStore((s) => s.setToolAnnotations);

  const maxOutputTokens = useAppStore(s => s.maxOutputTokens);
  const setMaxOutputTokens = useAppStore(s => s.setMaxOutputTokens);
  const stopTools = useAppStore(s => s.stopTools);
  const setStopTools = useAppStore(s => s.setStopTools);
  const maxToolCalls = useAppStore(s => s.maxToolCalls);
  const setMaxToolCalls = useAppStore(s => s.setMaxToolCalls);
  const toolChoice = useAppStore(s => s.toolChoice);
  const setToolChoice = useAppStore(s => s.setToolChoice);
  const tools = useTools();
  const availableTools = tools.tools.map(z => z.name)
  const onToggle = (key: keyof ToolAnnotations) =>
    setToolAnnotations({
      ...(toolAnnotations ?? {}),
      [key]: !toolAnnotations?.[key],
    });

  const aiSettings = {
    temperature: temperature,
    maxOutputTokens,
  };

  const toolSettings = {
    stopTools,
    maxToolCalls,
    toolChoice,
  };


  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <AiChatSettingsForm
          value={aiSettings}
          formTitle={t("ai.title")}
          onChange={(val) => {
            setTemperature(val.temperature);
            setMaxOutputTokens(val.maxOutputTokens);
          }} />

        <ChatSettingsForm
          value={{ throttle: experimentalThrottle ?? 100 }}
          formTitle={t("chat")}
          onChange={(val) => setThrottle(val.throttle)} />

        <AiChatToolsSettingsForm
          value={toolSettings}
          formTitle={t("tools") ?? "Tools"}
          availableTools={availableTools}
          onChange={(val) => {
            setStopTools(val.stopTools);
            setMaxToolCalls(val.maxToolCalls);
            setToolChoice(val.toolChoice);
          }}
        />

        <McpPolicySettings
          policySettings={toolAnnotations}
          toggle={onToggle} />

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
