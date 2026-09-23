import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ApertisChatConfigForm, type ApertisChatConfig } from "aihappey-components";

const Wrapper = ({
  initialConfig = { compression: { enabled: false } },
}: {
  initialConfig?: ApertisChatConfig;
}) => {
  const [config, setConfig] = useState<ApertisChatConfig>(initialConfig);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 0.65fr)", gap: 24 }}>
      <ApertisChatConfigForm config={config} updateConfig={setConfig} />
      <pre style={{ margin: 0, padding: 16, overflow: "auto" }}>
        {JSON.stringify({ apertis: config }, null, 2)}
      </pre>
    </div>
  );
};

const meta: Meta<typeof ApertisChatConfigForm> = {
  title: "Forms/Providers/Apertis/ApertisChatConfigForm",
  component: ApertisChatConfigForm,
};
export default meta;
type Story = StoryObj<typeof ApertisChatConfigForm>;

export const DefaultDisabled: Story = { render: () => <Wrapper /> };

export const Configured: Story = {
  render: () => <Wrapper initialConfig={{
    reasoning: { effort: "high", summary: "detailed" },
    compression: { enabled: true, strategy: "on", threshold: 8000, keep_turns: 6, model: "auto" },
  }} />,
};

export const CustomModel: Story = {
  render: () => <Wrapper initialConfig={{
    compression: { enabled: true, strategy: "aggressive", model: "gpt-4.1-mini" },
  }} />,
};

export const StrategyDefaultTurns: Story = {
  render: () => <Wrapper initialConfig={{
    compression: { enabled: true, strategy: "conservative", keep_turns: 0 },
  }} />,
};
