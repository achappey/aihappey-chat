import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { GroqChatConfigForm } from "aihappey-components";

type WrapperProps = {
  initialConfig?: any;
};

const Wrapper: React.FC<WrapperProps> = ({ initialConfig }) => {
  const [config, setConfig] = useState<any>(initialConfig ?? {});

  return (
    <GroqChatConfigForm
      config={config}
      updateConfig={setConfig}
    />
  );
};

const meta: Meta<typeof GroqChatConfigForm> = {
  title: "Forms/Providers/Groq/GroqChatConfigForm",
  component: GroqChatConfigForm,
};

export default meta;

type Story = StoryObj<typeof GroqChatConfigForm>;

export const Default: Story = {
  render: () => <Wrapper />,
};

export const ReasoningEnabled: Story = {
  render: () => (
    <Wrapper
      initialConfig={{
        reasoning: { effort: "medium" },
      }}
    />
  ),
};

export const WithWebSearch: Story = {
  render: () => (
    <Wrapper
      initialConfig={{
        browser_search: { type: "browser_search" },
      }}
    />
  ),
};

export const FullyPopulated: Story = {
  render: () => (
    <Wrapper
      initialConfig={{
        reasoning: { effort: "high" },
        browser_search: { type: "browser_search" },
        code_interpreter: {
          type: "code_interpreter",
          container: { type: "auto" },
        },
        parallel_tool_calls: true,
        instructions: "Use concise reasoning and show results only.",
      }}
    />
  ),
};
