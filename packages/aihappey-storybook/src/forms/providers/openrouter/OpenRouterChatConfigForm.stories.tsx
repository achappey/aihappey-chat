import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { OpenRouterChatConfigForm } from "aihappey-components";

const Wrapper = () => {
  const [config, setConfig] = useState({
    tools: [
      {
        type: "openrouter:web_search",
        parameters: {
          engine: "auto",
          max_results: 5,
          search_context_size: "medium",
        },
      },
      {
        type: "openrouter:datetime",
        parameters: {
          timezone: "Europe/Amsterdam",
        },
      },
    ],
    provider: {
      zdr: true,
    },
  });

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <OpenRouterChatConfigForm
        config={config}
        appTitle="AIHappey Chat"
        updateConfig={setConfig}
      />
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(config, null, 2)}</pre>
    </div>
  );
};

const meta: Meta<typeof OpenRouterChatConfigForm> = {
  title: "Forms/Providers/OpenRouter/OpenRouterChatConfigForm",
  component: OpenRouterChatConfigForm,
  render: () => <Wrapper />,
};

export default meta;
type Story = StoryObj<typeof OpenRouterChatConfigForm>;

export const Default: Story = {};

