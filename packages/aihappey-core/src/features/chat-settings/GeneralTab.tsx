import {
  AiChatSettingsForm, AiChatToolsSettingsForm, ChatSettingsForm,
  McpPolicySettings,
} from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types";
import { useCallback, useMemo } from "react";
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
  setTemperature,
  maxOutputTokens,
  setMaxOutputTokens,
  structuredOutputs,
  setStructuredOutputs,
  experimentalThrottle,
  setThrottle,
  toolAnnotations,
  setToolAnnotations,
  stopTools,
  setStopTools,
  maxToolCalls,
  setMaxToolCalls,
  toolChoice,
  setToolChoice,
}: any) => {
  const { t } = useTranslation();
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
  const onToggle = useCallback(
    (key: keyof ToolAnnotations) =>
      setToolAnnotations({
        ...(toolAnnotations ?? {}),
        [key]: !toolAnnotations?.[key],
      }),
    [setToolAnnotations, toolAnnotations]
  );

  const aiSettings = useMemo(
    () => ({      
      maxOutputTokens,
    }),
    [ maxOutputTokens]
  );

  const toolSettings = useMemo(
    () => ({
      stopTools,
      maxToolCalls,
      toolChoice,
    }),
    [stopTools, maxToolCalls, toolChoice]
  );

  const chatSettings = useMemo(
    () => ({ throttle: experimentalThrottle ?? 100 }),
    [experimentalThrottle]
  );

  const handleThrottleChange = useCallback(
    (val: { throttle: number }) => setThrottle(val.throttle),
    [setThrottle]
  );

  const handleAiSettingsChange = useCallback(
    (val: { maxOutputTokens?: number }) => {
      setMaxOutputTokens(val.maxOutputTokens);
    },
    [setTemperature, setMaxOutputTokens]
  );


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
          onChange={handleAiSettingsChange} />

        <ChatSettingsForm
          value={chatSettings}
          formTitle={t("chat")}
          onChange={handleThrottleChange} />

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
