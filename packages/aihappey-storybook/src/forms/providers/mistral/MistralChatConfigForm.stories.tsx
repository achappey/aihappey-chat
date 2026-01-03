import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { MistralChatConfigForm } from "aihappey-components";

type WrapperProps = {
  initialConfig?: any;
};

const Wrapper: React.FC<WrapperProps> = ({ initialConfig }) => {
  const [config, setConfig] = useState<any>(initialConfig ?? {});

  return (
    <MistralChatConfigForm
      config={config}
      updateConfig={setConfig}
    />
  );
};

const meta: Meta<typeof MistralChatConfigForm> = {
  title: "Forms/Providers/Mistral/MistralChatConfigForm",
  component: MistralChatConfigForm,
};

export default meta;

type Story = StoryObj<typeof MistralChatConfigForm>;

export const Default: Story = {
  render: () => <Wrapper />,
};

export const WebSearchEnabled: Story = {
  render: () => (
    <Wrapper
      initialConfig={{
        web_search: { type: "web_search" },
      }}
    />
  ),
};

export const FullyPopulated: Story = {
  render: () => (
    <Wrapper
      initialConfig={{
        web_search_premium: { type: "web_search_premium" },
        image_generation: { type: "image_generation" },
        code_interpreter: { type: "code_interpreter" },
        document_library: {
          type: "document_library",
          library_ids: ["abc123", "xyz789"],
        },
      }}
    />
  ),
};
