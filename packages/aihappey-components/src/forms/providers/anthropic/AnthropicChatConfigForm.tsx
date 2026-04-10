import { AnthropicBashCard } from "./cards/AnthropicBashCard";
import { AnthropicBetaCard } from "./cards/AnthropicBetaCard";
import { AnthropicCodeExecutionCard } from "./cards/AnthropicCodeExecutionCard";
import { AnthropicMemoryCard } from "./cards/AnthropicMemoryCard";
import { AnthropicNativeMcpCard } from "./cards/AnthropicNativeMcpCard";
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

export const AnthropicChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const resolvedConfig = withResolvedProviderTools(config, ANTHROPIC_TOOL_TYPES);
  const submitConfig = (nextConfig: any) =>
    updateConfig(buildCanonicalProviderToolsConfig(nextConfig, ANTHROPIC_TOOL_TYPES));

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
      <AnthropicNativeMcpCard config={resolvedConfig} updateConfig={submitConfig} />
      <AnthropicBetaCard config={resolvedConfig} updateConfig={submitConfig} />
    </div>
  );
};
