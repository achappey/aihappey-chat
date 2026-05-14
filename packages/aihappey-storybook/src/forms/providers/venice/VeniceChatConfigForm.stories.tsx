import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { VeniceChatConfigForm } from "aihappey-components";

const Wrapper = () => {
  const [config, setConfig] = useState<any>({});

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <VeniceChatConfigForm config={config} updateConfig={setConfig} />
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(config, null, 2)}</pre>
    </div>
  );
};

const meta: Meta<typeof VeniceChatConfigForm> = {
  title: "Forms/Providers/Venice/VeniceChatConfigForm",
  component: VeniceChatConfigForm,
  render: () => <Wrapper />,
};

export default meta;
type Story = StoryObj<typeof VeniceChatConfigForm>;

export const Default: Story = {};

