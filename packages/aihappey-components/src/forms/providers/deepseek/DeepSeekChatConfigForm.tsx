import { useTranslation } from "aihappey-i18n";

import { useTheme } from "../../../theme/ThemeContext";

const REASONING_EFFORTS = ["low", "high", "max"] as const;
type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

const DEFAULT_REASONING_EFFORT: ReasoningEffort = "high";

export type DeepSeekChatConfig = {
  reasoning?: {
    effort?: ReasoningEffort | "none";
    [key: string]: unknown;
  };
  tools?: { type: string; [key: string]: unknown }[];
  [key: string]: unknown;
};

export const normalizeDeepSeekChatConfig = (config: DeepSeekChatConfig): DeepSeekChatConfig => {
  const { thinking, reasoning_effort, ...next } = config;
  if (!("reasoning" in next) && (thinking !== undefined || reasoning_effort !== undefined)) {
    next.reasoning = {
      effort: (thinking as { type?: string } | undefined)?.type === "disabled"
        ? "none"
        : (reasoning_effort ?? DEFAULT_REASONING_EFFORT) as ReasoningEffort,
    };
  }
  return next;
};

export const setDeepSeekWebSearch = (config: DeepSeekChatConfig, enabled: boolean): DeepSeekChatConfig => {
  const next = normalizeDeepSeekChatConfig(config);
  const existing = next.tools?.find((tool) => tool.type === "web_search");
  const otherTools = next.tools?.filter((tool) => tool.type !== "web_search") ?? [];
  return { ...next, tools: enabled ? [...otherTools, existing ?? { type: "web_search" }] : otherTools };
};

export const DeepSeekChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: DeepSeekChatConfig;
  updateConfig: (config: DeepSeekChatConfig) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const normalized = normalizeDeepSeekChatConfig(config ?? {});
  const reasoningOn = normalized.reasoning?.effort !== "none";
  const reasoningEffort = REASONING_EFFORTS.includes(normalized.reasoning?.effort as ReasoningEffort)
    ? (normalized.reasoning!.effort as ReasoningEffort)
    : DEFAULT_REASONING_EFFORT;
  const options = REASONING_EFFORTS.map((value) => ({
    value,
    label: t(value),
  }));

  const toggleReasoning = (enabled: boolean) => {
    updateConfig({
      ...normalized,
      reasoning: { ...normalized.reasoning, effort: enabled ? DEFAULT_REASONING_EFFORT : "none" },
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
    <theme.Card
      size="small"
      title={t("reasoning")}
      headerActions={
        <theme.Switch
          id="deepseek-reasoning"
          checked={reasoningOn}
          onChange={toggleReasoning}
        />
      }
    >
      <theme.Select
        label={t("reasoningEffort", {
          reasoningEffort: t(reasoningEffort),
        })}
        disabled={!reasoningOn}
        values={[reasoningEffort]}
        valueTitle={t(reasoningEffort)}
        options={options}
        onChange={(value: string) =>
          updateConfig({
            ...normalized,
            reasoning: { ...normalized.reasoning, effort: value as ReasoningEffort },
          })
        }
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </theme.Select>
    </theme.Card>
    <theme.Card
      size="small"
      title={t("webSearch")}
      headerActions={
        <theme.Switch
          id="deepseek-web-search"
          checked={normalized.tools?.some((tool) => tool.type === "web_search") ?? false}
          onChange={(enabled) => updateConfig(setDeepSeekWebSearch(normalized, enabled))}
        />
      }
    >
    </theme.Card>
    </div>
  );
};
