import { useRef } from "react";
import { AnthropicBashCard } from "./cards/AnthropicBashCard";
import { AnthropicBetaCard } from "./cards/AnthropicBetaCard";
import { AnthropicCodeExecutionCard } from "./cards/AnthropicCodeExecutionCard";
import { AnthropicContextManagementCard } from "./cards/AnthropicContextManagementCard";
import { AnthropicMemoryCard } from "./cards/AnthropicMemoryCard";
import { AnthropicReasoningCard } from "./cards/AnthropicReasoningCard";
import { AnthropicTextEditorCard } from "./cards/AnthropicTextEditorCard";
import { AnthropicToolSearchBm25Card } from "./cards/AnthropicToolSearchBm25Card";
import { AnthropicToolSearchRegexCard } from "./cards/AnthropicToolSearchRegexCard";
import { AnthropicWebFetchCard } from "./cards/AnthropicWebFetchCard";
import { AnthropicWebSearchCard } from "./cards/AnthropicWebSearchCard";
import {
  buildCanonicalProviderToolsConfig,
  withResolvedProviderTools,
} from "../providerToolConfig";

const ANTHROPIC_TOOL_TYPES = [
  "bash",
  "code_execution",
  "memory",
  "text_editor",
  "web_fetch",
  "web_search",
  "tool_search_tool_bm25",
  "tool_search_tool_regex",
];

const REQUIRED_CONTEXT_MANAGEMENT_BETA = "context-management-2025-06-27";

const parseAnthropicBeta = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );
  }

  if (typeof value === "string") {
    return Array.from(
      new Set(
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );
  }

  return [];
};

const serializeAnthropicBeta = (value: string[]) =>
  Array.from(new Set(value.map((item) => item.trim()).filter(Boolean))).join(",");

const getContextManagementEdits = (value: any) =>
  Array.isArray(value?.context_management?.edits)
    ? value.context_management.edits
    : [];

const hasContextManagementEdits = (value: any) =>
  getContextManagementEdits(value).length > 0;

const normalizeAnthropicContextManagementConfig = (
  previousConfig: any,
  nextConfig: any,
  autoManagedContextManagementBeta: { current: boolean }
) => {
  const currentHasContextManagement = hasContextManagementEdits(previousConfig);
  const nextContextManagementEdits = getContextManagementEdits(nextConfig);
  const nextHasContextManagement = nextContextManagementEdits.length > 0;
  const currentBetas = parseAnthropicBeta(previousConfig?.["anthropic-beta"]);
  const requestedNextBetas = parseAnthropicBeta(nextConfig?.["anthropic-beta"]);
  const betaListChanged =
    serializeAnthropicBeta(currentBetas) !== serializeAnthropicBeta(requestedNextBetas);

  let nextBetas = requestedNextBetas;

  if (nextHasContextManagement) {
    if (!requestedNextBetas.includes(REQUIRED_CONTEXT_MANAGEMENT_BETA)) {
      nextBetas = [...requestedNextBetas, REQUIRED_CONTEXT_MANAGEMENT_BETA];
      autoManagedContextManagementBeta.current = true;
    } else if (
      autoManagedContextManagementBeta.current &&
      currentHasContextManagement &&
      betaListChanged
    ) {
      autoManagedContextManagementBeta.current = false;
    }
  } else if (
    currentHasContextManagement &&
    autoManagedContextManagementBeta.current &&
    requestedNextBetas.includes(REQUIRED_CONTEXT_MANAGEMENT_BETA)
  ) {
    nextBetas = requestedNextBetas.filter(
      (value) => value !== REQUIRED_CONTEXT_MANAGEMENT_BETA
    );
    autoManagedContextManagementBeta.current = false;
  }

  return {
    ...nextConfig,
    context_management: nextHasContextManagement
      ? {
        ...(nextConfig?.context_management ?? {}),
        edits: nextContextManagementEdits,
      }
      : undefined,
    "anthropic-beta": nextBetas.length
      ? serializeAnthropicBeta(nextBetas)
      : undefined,
  };
};

export const AnthropicChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const autoManagedContextManagementBeta = useRef(false);
  const resolvedConfig = withResolvedProviderTools(config, ANTHROPIC_TOOL_TYPES);
  const submitConfig = (nextConfig: any) =>
    updateConfig(
      buildCanonicalProviderToolsConfig(
        normalizeAnthropicContextManagementConfig(
          resolvedConfig,
          nextConfig,
          autoManagedContextManagementBeta
        ),
        ANTHROPIC_TOOL_TYPES
      )
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <AnthropicReasoningCard config={resolvedConfig} updateConfig={submitConfig} />

      <AnthropicBashCard config={resolvedConfig} updateConfig={submitConfig} />
      <AnthropicWebSearchCard config={resolvedConfig} updateConfig={submitConfig} />
      <AnthropicWebFetchCard config={resolvedConfig} updateConfig={submitConfig} />
      <AnthropicCodeExecutionCard
        config={resolvedConfig}
        updateConfig={submitConfig}
      />
      <AnthropicTextEditorCard
        config={resolvedConfig}
        updateConfig={submitConfig}
      />
      <AnthropicMemoryCard config={resolvedConfig} updateConfig={submitConfig} />
      <AnthropicToolSearchBm25Card
        config={resolvedConfig}
        updateConfig={submitConfig}
      />
      <AnthropicToolSearchRegexCard
        config={resolvedConfig}
        updateConfig={submitConfig}
      />

      <AnthropicContextManagementCard
        config={resolvedConfig}
        updateConfig={submitConfig}
      />
      <AnthropicBetaCard config={resolvedConfig} updateConfig={submitConfig} />
    </div>
  );
};
