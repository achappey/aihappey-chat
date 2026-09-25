import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  BasetenChatConfigForm,
  type BasetenChatConfig,
} from "aihappey-components";

const Wrapper = ({ initialConfig = {} }: { initialConfig?: BasetenChatConfig }) => {
  const [config, setConfig] = useState<BasetenChatConfig>(initialConfig);
  const [headers, setHeaders] = useState<Record<string, string> | undefined>({});

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 0.7fr)",
        gap: 24,
      }}
    >
      <BasetenChatConfigForm
        config={config}
        headers={headers}
        updateConfig={setConfig}
        updateHeaders={setHeaders}
      />
      <pre style={{ margin: 0, padding: 16, overflow: "auto" }}>
        {JSON.stringify(
          {
            providerMetadata: { baseten: config },
            providerHeaders: { baseten: headers },
          },
          null,
          2
        )}
      </pre>
    </div>
  );
};

const meta: Meta<typeof BasetenChatConfigForm> = {
  title: "Forms/Providers/Baseten/BasetenChatConfigForm",
  component: BasetenChatConfigForm,
};

export default meta;
type Story = StoryObj<typeof BasetenChatConfigForm>;

export const Empty: Story = {
  render: () => <Wrapper />,
};

export const Configured: Story = {
  render: () => (
    <Wrapper
      initialConfig={{
        chat_template_args: { enable_thinking: false },
        reasoning_effort: "max",
        tools: [
          { type: "baseten__exa__web_search_exa" },
          { type: "baseten__exa__web_fetch_exa" },
          { type: "baseten__exa__web_search_advanced_exa" },
        ],
        baseten: { tool_settings: { max_react_iterations: 6 } },
      }}
    />
  ),
};
