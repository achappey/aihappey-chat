import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { OpenHandsChatConfigForm, type OpenHandsChatConfig } from "aihappey-components";

const Wrapper = () => {
  const [config, setConfig] = useState<OpenHandsChatConfig>({
    selected_repository: "yourusername/your-repo",
  });

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <OpenHandsChatConfigForm config={config} updateConfig={setConfig} />
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(config, null, 2)}</pre>
    </div>
  );
};

const meta: Meta<typeof OpenHandsChatConfigForm> = {
  title: "Forms/Providers/OpenHands/OpenHandsChatConfigForm",
  component: OpenHandsChatConfigForm,
  render: () => <Wrapper />,
};

export default meta;
type Story = StoryObj<typeof OpenHandsChatConfigForm>;

export const Default: Story = {};

