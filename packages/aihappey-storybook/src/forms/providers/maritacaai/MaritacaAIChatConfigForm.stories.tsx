import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { MaritacaAIChatConfigForm } from "aihappey-components";

const Wrapper = () => {
  const [config, setConfig] = useState<any>({});

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <MaritacaAIChatConfigForm config={config} updateConfig={setConfig} />
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(config, null, 2)}</pre>
    </div>
  );
};

const meta: Meta<typeof MaritacaAIChatConfigForm> = {
  title: "Forms/Providers/MaritacaAI/MaritacaAIChatConfigForm",
  component: MaritacaAIChatConfigForm,
  render: () => <Wrapper />,
};

export default meta;
type Story = StoryObj<typeof MaritacaAIChatConfigForm>;

export const Default: Story = {};
