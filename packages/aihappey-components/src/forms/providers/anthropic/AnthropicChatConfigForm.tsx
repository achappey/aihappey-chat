import { AnthropicBetaCard } from "./cards/AnthropicBetaCard";
import { AnthropicCodeExecutionCard } from "./cards/AnthropicCodeExecutionCard";
import { AnthropicMemoryCard } from "./cards/AnthropicMemoryCard";
import { AnthropicNativeMcpCard } from "./cards/AnthropicNativeMcpCard";
import { AnthropicReasoningCard } from "./cards/AnthropicReasoningCard";
import { AnthropicWebFetchCard } from "./cards/AnthropicWebFetchCard";
import { AnthropicWebSearchCard } from "./cards/AnthropicWebSearchCard";

export const AnthropicChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <AnthropicReasoningCard config={config} updateConfig={updateConfig} />
      <AnthropicWebSearchCard config={config} updateConfig={updateConfig} />
      <AnthropicWebFetchCard config={config} updateConfig={updateConfig} />
      <AnthropicCodeExecutionCard config={config} updateConfig={updateConfig} />
      <AnthropicMemoryCard config={config} updateConfig={updateConfig} />
      <AnthropicNativeMcpCard config={config} updateConfig={updateConfig} />
      <AnthropicBetaCard config={config} updateConfig={updateConfig} />
    </div>
  );
};
