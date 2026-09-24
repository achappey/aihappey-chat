import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

import {
  NeuralwattChatConfigForm,
  type NeuralwattChatConfig,
} from "aihappey-components";

const meta: Meta<typeof NeuralwattChatConfigForm> = {
  title: "Forms/Providers/Neuralwatt/NeuralwattChatConfigForm",
  component: NeuralwattChatConfigForm,
};

export default meta;
type Story = StoryObj<typeof NeuralwattChatConfigForm>;

const Wrapper = ({ initialConfig }: { initialConfig: NeuralwattChatConfig }) => {
  const [config, setConfig] = useState(initialConfig);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <NeuralwattChatConfigForm config={config} updateConfig={setConfig} />
      <pre>{JSON.stringify(config, null, 2)}</pre>
    </div>
  );
};

export const ProviderDefaults: Story = {
  render: () => <Wrapper initialConfig={{}} />,
};

export const FullyConfigured: Story = {
  render: () => (
    <Wrapper
      initialConfig={{
        reasoning_effort: "xhigh",
        thinking_token_budget: 4096,
        service_tier: "flex",
      }}
    />
  ),
};
