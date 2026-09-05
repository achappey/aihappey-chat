import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { DeepSeekChatConfigForm, type DeepSeekChatConfig } from "aihappey-components";

const Wrapper = ({ initialConfig = {} }: { initialConfig?: DeepSeekChatConfig }) => {
  const [config, setConfig] = useState<DeepSeekChatConfig>(initialConfig);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 0.65fr)", gap: 24 }}>
      <DeepSeekChatConfigForm config={config} updateConfig={setConfig} />
      <pre style={{ margin: 0, padding: 16, overflow: "auto" }}>
        {JSON.stringify(config, null, 2)}
      </pre>
    </div>
  );
};

const meta: Meta<typeof DeepSeekChatConfigForm> = {
  title: "Forms/Providers/DeepSeek/DeepSeekChatConfigForm",
  component: DeepSeekChatConfigForm,
};

export default meta;
type Story = StoryObj<typeof DeepSeekChatConfigForm>;

export const Default: Story = {
  render: () => <Wrapper />,
};

export const Enabled: Story = {
  render: () => (
    <Wrapper initialConfig={{ thinking: { type: "enabled" }, reasoning_effort: "high" }} />
  ),
};

export const MaximumEffort: Story = {
  render: () => (
    <Wrapper initialConfig={{ thinking: { type: "enabled" }, reasoning_effort: "max" }} />
  ),
};

export const Disabled: Story = {
  render: () => <Wrapper initialConfig={{ thinking: { type: "disabled" } }} />,
};
