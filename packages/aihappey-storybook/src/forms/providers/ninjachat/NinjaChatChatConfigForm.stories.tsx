import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { NinjaChatChatConfigForm, type NinjaChatChatConfig } from "aihappey-components";

const Wrapper = () => {
  const [config, setConfig] = useState<NinjaChatChatConfig>({
    group: "web",
    max_results: 10,
    search_depth: "basic",
    include_images: false,
    topic: "general",
  });

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <NinjaChatChatConfigForm config={config} updateConfig={setConfig} />
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(config, null, 2)}</pre>
    </div>
  );
};

const meta: Meta<typeof NinjaChatChatConfigForm> = {
  title: "Forms/Providers/NinjaChat/NinjaChatChatConfigForm",
  component: NinjaChatChatConfigForm,
  render: () => <Wrapper />,
};

export default meta;
type Story = StoryObj<typeof NinjaChatChatConfigForm>;

export const Default: Story = {};

