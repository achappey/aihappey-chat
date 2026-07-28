import { useRef } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";
import { AnthropicAdvisorCard } from "./cards/AnthropicAdvisorCard";
import { AnthropicBashCard } from "./cards/AnthropicBashCard";
import { AnthropicBetaCard } from "./cards/AnthropicBetaCard";
import { AnthropicCacheCard } from "./cards/AnthropicCacheCard";
import { AnthropicCodeExecutionCard } from "./cards/AnthropicCodeExecutionCard";
import {
  AnthropicContainerCard,
  normalizeAnthropicContainer,
} from "./cards/AnthropicContainerCard";
import { AnthropicContextManagementCard } from "./cards/AnthropicContextManagementCard";
import { AnthropicMemoryCard } from "./cards/AnthropicMemoryCard";
import { AnthropicOutputConfigCard } from "./cards/AnthropicOutputConfigCard";
import { AnthropicReasoningCard } from "./cards/AnthropicReasoningCard";
import { AnthropicTextEditorCard } from "./cards/AnthropicTextEditorCard";
import { parseAnthropicNumberInput } from "./cards/AnthropicToolCardShared";
import { AnthropicToolSearchBm25Card } from "./cards/AnthropicToolSearchBm25Card";
import { AnthropicToolSearchRegexCard } from "./cards/AnthropicToolSearchRegexCard";
import { AnthropicWebFetchCard } from "./cards/AnthropicWebFetchCard";
import { AnthropicWebSearchCard } from "./cards/AnthropicWebSearchCard";
import {
  buildCanonicalProviderToolsConfig,
  withResolvedProviderTools,
} from "../providerToolConfig";

const ANTHROPIC_TOOL_TYPES = [
  "advisor",
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
const REQUIRED_ADVISOR_BETA = "advisor-tool-2026-03-01";

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

const hasAdvisorTool = (value: any) => !!value?.advisor;

const normalizeAnthropicContainerConfig = (nextConfig: any) => ({
  ...nextConfig,
  container:
    nextConfig?.container === undefined
      ? undefined
      : normalizeAnthropicContainer(nextConfig.container),
});

const withoutAnthropicBetaBody = (config: any) => {
  const { "anthropic-beta": _beta, ...bodyConfig } = config ?? {};
  return bodyConfig;
};

const cleanProviderHeaders = (headers: Record<string, string> | undefined) => {
  const cleanHeaders = Object.fromEntries(
    Object.entries(headers ?? {})
      .filter(([, value]) => value != null && String(value).trim().length > 0)
      .map(([key, value]) => [key, String(value)]),
  );

  return Object.keys(cleanHeaders).length ? cleanHeaders : undefined;
};

const normalizeAnthropicContextManagementConfig = (
  previousConfig: any,
  nextConfig: any,
  previousHeaders: Record<string, string> | undefined,
  nextHeaders: Record<string, string> | undefined,
  autoManagedContextManagementBeta: { current: boolean },
  autoManagedAdvisorBeta: { current: boolean }
) => {
  const currentHasContextManagement = hasContextManagementEdits(previousConfig);
  const nextContextManagementEdits = getContextManagementEdits(nextConfig);
  const nextHasContextManagement = nextContextManagementEdits.length > 0;
  const currentHasAdvisor = hasAdvisorTool(previousConfig);
  const nextHasAdvisor = hasAdvisorTool(nextConfig);
  const currentBetas = parseAnthropicBeta(previousHeaders?.["anthropic-beta"] ?? previousConfig?.["anthropic-beta"]);
  const requestedNextBetas = parseAnthropicBeta(nextHeaders?.["anthropic-beta"] ?? nextConfig?.["anthropic-beta"]);
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

  if (nextHasAdvisor) {
    if (!nextBetas.includes(REQUIRED_ADVISOR_BETA)) {
      nextBetas = [...nextBetas, REQUIRED_ADVISOR_BETA];
      autoManagedAdvisorBeta.current = true;
    } else if (
      autoManagedAdvisorBeta.current &&
      currentHasAdvisor &&
      betaListChanged
    ) {
      autoManagedAdvisorBeta.current = false;
    }
  } else if (
    currentHasAdvisor &&
    autoManagedAdvisorBeta.current &&
    nextBetas.includes(REQUIRED_ADVISOR_BETA)
  ) {
    nextBetas = nextBetas.filter((value) => value !== REQUIRED_ADVISOR_BETA);
    autoManagedAdvisorBeta.current = false;
  }

  return {
    ...nextConfig,
    context_management: nextHasContextManagement
      ? {
        ...(nextConfig?.context_management ?? {}),
        edits: nextContextManagementEdits,
      }
      : undefined,
    providerHeaders: {
      ...(nextHeaders ?? {}),
      "anthropic-beta": nextBetas.length
        ? serializeAnthropicBeta(nextBetas)
        : undefined,
    },
  };
};

export const AnthropicChatConfigForm = ({
  config,
  headers,
  updateConfig,
  updateHeaders,
}: {
  config: any;
  headers?: Record<string, string>;
  updateConfig: (val: any) => void;
  updateHeaders?: (val: Record<string, string> | undefined) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const autoManagedContextManagementBeta = useRef(false);
  const autoManagedAdvisorBeta = useRef(false);
  const resolvedConfig = withResolvedProviderTools(config, ANTHROPIC_TOOL_TYPES);
  const submitConfig = (nextConfig: any, nextHeaders: Record<string, string> | undefined = headers) => {
    const normalized =
      buildCanonicalProviderToolsConfig(
        normalizeAnthropicContainerConfig(
          normalizeAnthropicContextManagementConfig(
            resolvedConfig,
            nextConfig,
            headers,
            nextHeaders,
            autoManagedContextManagementBeta,
            autoManagedAdvisorBeta
          )
        ),
        ANTHROPIC_TOOL_TYPES
      );
    const { providerHeaders, ...bodyConfig } = normalized as any;

    updateConfig(withoutAnthropicBetaBody(bodyConfig));
    updateHeaders?.(cleanProviderHeaders(providerHeaders));
  };

  const submitHeaders = (nextHeaders: Record<string, string> | undefined) => {
    const normalized = normalizeAnthropicContextManagementConfig(
      resolvedConfig,
      resolvedConfig,
      headers,
      nextHeaders,
      autoManagedContextManagementBeta,
      autoManagedAdvisorBeta
    );

    updateHeaders?.(cleanProviderHeaders((normalized as any).providerHeaders));
  };

  const updateMaxTokens = (value: string) => {
    const nextMaxTokens = parseAnthropicNumberInput(value);

    if (nextMaxTokens === undefined) {
      const nextConfig = { ...(resolvedConfig ?? {}) };
      delete nextConfig.max_tokens;
      submitConfig(nextConfig);
      return;
    }

    submitConfig({
      ...resolvedConfig,
      max_tokens: nextMaxTokens,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      <theme.Input
        type="number"
        min={1}
        required
        step={1}
        label={t("maxOutputTokens") ?? "max_tokens"}
        value={resolvedConfig?.max_tokens ?? ""}
        onChange={(e: any) => updateMaxTokens(e.target.value)}
      />

      <AnthropicCacheCard config={resolvedConfig} updateConfig={submitConfig} />

      <AnthropicReasoningCard config={resolvedConfig} updateConfig={submitConfig} />
      <AnthropicOutputConfigCard config={resolvedConfig} updateConfig={submitConfig} />
      <AnthropicContainerCard config={resolvedConfig} updateConfig={submitConfig} />


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

      <AnthropicAdvisorCard config={resolvedConfig} updateConfig={submitConfig} />

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
      <AnthropicBetaCard config={resolvedConfig} headers={headers} updateConfig={submitConfig} updateHeaders={submitHeaders} />
    </div>
  );
};
