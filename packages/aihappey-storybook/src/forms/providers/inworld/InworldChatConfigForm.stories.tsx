import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { InworldChatConfigForm } from "aihappey-components";

const Wrapper = ({ initialConfig = {} }: { initialConfig?: any }) => {
  const [config, setConfig] = useState(initialConfig);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 0.65fr)", gap: 24 }}>
      <InworldChatConfigForm config={config} updateConfig={setConfig} />
      <pre style={{ margin: 0, padding: 16, overflow: "auto" }}>
        {JSON.stringify(config, null, 2)}
      </pre>
    </div>
  );
};

const meta: Meta<typeof InworldChatConfigForm> = {
  title: "Forms/Providers/Inworld/InworldChatConfigForm",
  component: InworldChatConfigForm,
};

export default meta;
type Story = StoryObj<typeof InworldChatConfigForm>;

export const Default: Story = {
  render: () => <Wrapper />,
};

export const FullyPopulated: Story = {
  render: () => (
    <Wrapper
      initialConfig={{
        web_search: { engine: "google", max_results: 5, max_steps: 2 },
        modalities: ["text", "image"],
        image_config: {
          aspect_ratio: "16:9",
          image_size: "2K",
          partial_images: 2,
          n: 1,
        },
        reasoning_effort: "high",
      }}
    />
  ),
};
