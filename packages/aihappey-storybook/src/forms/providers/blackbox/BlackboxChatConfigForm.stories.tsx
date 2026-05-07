import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { BlackboxChatConfigForm } from "aihappey-components";

const Wrapper = () => {
  const [config, setConfig] = useState({
    reasoning: {
      effort: "medium",
      summary: "auto",
    },
    provider: {
      zdr: true,
    },
  });

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <BlackboxChatConfigForm config={config} updateConfig={setConfig} />
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(config, null, 2)}</pre>
    </div>
  );
};

const meta: Meta<typeof BlackboxChatConfigForm> = {
  title: "Forms/Providers/BLACKBOX/BlackboxChatConfigForm",
  component: BlackboxChatConfigForm,
  render: () => <Wrapper />,
};

export default meta;
type Story = StoryObj<typeof BlackboxChatConfigForm>;

export const Default: Story = {};

