import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";

import { useTheme } from "../../../theme/ThemeContext";

const EFFORTS = ["low", "medium", "high"] as const;
type Effort = (typeof EFFORTS)[number];

const DEFAULT_REASONING_EFFORT: Effort = "medium";
const DEFAULT_CHAT_TEMPLATE_KWARGS = { enable_thinking: true };

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

export const SambanovaChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const reasoningOn = config?.reasoning_effort !== undefined;

  const options = useMemo(
    () =>
      EFFORTS.map((v) => ({
        value: v,
        label: t(v),
      })),
    [t]
  );

  const [chatTemplateText, setChatTemplateText] = useState<string>(
    safeStringify(config?.chat_template_kwargs ?? DEFAULT_CHAT_TEMPLATE_KWARGS)
  );
  const [chatTemplateError, setChatTemplateError] = useState<string | undefined>(
    undefined
  );

  // Keep textarea in sync when config changes externally (eg restore defaults).
  useEffect(() => {
    setChatTemplateText(
      safeStringify(config?.chat_template_kwargs ?? DEFAULT_CHAT_TEMPLATE_KWARGS)
    );
    setChatTemplateError(undefined);
  }, [config?.chat_template_kwargs]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("reasoning")}
        headerActions={
          <theme.Switch
            id="sambanova_reasoning_effort"
            checked={reasoningOn}
            onChange={(val) =>
              updateConfig({
                ...config,
                reasoning_effort: val ? DEFAULT_REASONING_EFFORT : undefined,
              })
            }
          />
        }
      >
        <div>
          <theme.Select
            label={t("reasoningEffort", {
              reasoningEffort: t(config?.reasoning_effort ?? "none"),
            })}
            disabled={!reasoningOn}
            values={[config?.reasoning_effort ?? ""]}
            valueTitle={
              options.find((o) => o.value === config?.reasoning_effort)?.label
            }
            options={options}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                reasoning_effort: val as Effort,
              })
            }
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>
        </div>
      </theme.Card>

      <theme.TextArea
        label={t("providers:sambanova.chat_template_kwargs")}
        placeholder={t("providers:sambanova.chat_template_kwargs_placeholder")}
        rows={8}
        hint={chatTemplateError ? t("providers:sambanova.invalid_json") + chatTemplateError : undefined}
        value={chatTemplateText}
        onChange={(value) => {
          setChatTemplateText(value);

          try {
            const parsed = JSON.parse(value);
            setChatTemplateError(undefined);
            updateConfig({
              ...config,
              chat_template_kwargs: parsed,
            });
          } catch (e: any) {
            // Keep raw text, but do not mutate config until JSON is valid.
            setChatTemplateError(e?.message ?? "Invalid JSON");
          }
        }}
      />


      <theme.Switch
        id="sambanova_parallel_tool_calls"
        checked={!!config?.parallel_tool_calls}
        label={t("parallelToolCalls")}
        onChange={(value) =>
          updateConfig({
            ...config,
            parallel_tool_calls: value,
          })
        }
      />
    </div>
  );
};

