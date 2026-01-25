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
import { useStructuredOutputs } from "aihappey-structured-outputs";

function toValidSchemaName(name: string): string {
  return name
    .normalize("NFKD")              // normalize unicode
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-zA-Z0-9_-]+/g, "_") // replace invalid chars with _
    .replace(/^_+|_+$/g, "")         // trim leading/trailing _
    .replace(/_{2,}/g, "_")          // collapse ___ → _
    .slice(0, 64) || "schema";       // safety fallback
}


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
  const structuredOutputsStore = useStructuredOutputs();

  const structuredOutputOptions = useMemo(
    () =>
      (structuredOutputsStore.items ?? [])
        .slice()
        // .map(a => ({key: a.id, label: a.name}))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [structuredOutputsStore.items]
  );

  const structuredOutputOptionItems =
    structuredOutputOptions.map(a => ({ key: a.id, label: a.name }))

  const selectedStructuredOutputId = useMemo(() => {
    if (!structuredOutputs?.json_schema) return "";
    const currentName = structuredOutputs.json_schema?.name;
    const currentSchema = structuredOutputs.json_schema?.schema;
    return (
      structuredOutputOptions.find((item) => {
        if (toValidSchemaName(item.name) !== currentName) return false;
        try {
          const parsed = JSON.parse(item.json_schema);
          return JSON.stringify(parsed) === JSON.stringify(currentSchema);
        } catch {
          return false;
        }
      })?.id ?? ""
    );
  }, [structuredOutputOptions, structuredOutputs]);
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
          structuredOutputOptions={structuredOutputOptionItems}
          structuredOutputValueTitle={
            structuredOutputOptions.find((item) => item.id === selectedStructuredOutputId)
              ?.name ?? t("providerDefault")
          }
          structuredOutputValue={selectedStructuredOutputId || ""}
          onStructuredOutputChange={(selectedValue) => {
            if (!selectedValue) {
              setStructuredOutputs(undefined);
              return;
            }

            const selected = structuredOutputOptions.find((item) => item.id === selectedValue);
            if (!selected) return;

            try {
              const parsedSchema = JSON.parse(selected.json_schema);
              setStructuredOutputs({
                type: "json_schema",
                json_schema: {
                  name: toValidSchemaName(selected.name),
                  schema: parsedSchema,
                },
              });
            } catch {
              setStructuredOutputs(undefined);
            }
          }}
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

      </div>

    </>
  );
};
