import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { JinaChatConfigForm } from "aihappey-components";

type WrapperProps = {
  initialConfig?: any;
};

const Wrapper: React.FC<WrapperProps> = ({ initialConfig }) => {
  const [config, setConfig] = useState<any>(initialConfig ?? {});

  return (
    <JinaChatConfigForm
      config={config}
      updateConfig={setConfig}
    />
  );
};

const meta: Meta<typeof JinaChatConfigForm> = {
  title: "Forms/Providers/Jina/JinaChatConfigForm",
  component: JinaChatConfigForm,
};

export default meta;

type Story = StoryObj<typeof JinaChatConfigForm>;

export const Default: Story = {
  render: () => <Wrapper />,
};

export const ReasoningMedium: Story = {
  render: () => (
    <Wrapper
      initialConfig={{
        reasoning_effort: "medium",
      }}
    />
  ),
};

export const FullyPopulated: Story = {
  render: () => (
    <Wrapper
      initialConfig={{
        reasoning_effort: "high",
        max_returned_urls: 5,
        team_size: 3,
        boost_hostnames: ["good.com", "trusted.org"],
        bad_hostnames: ["spam.com"],
        only_hostnames: ["docs.jina.ai"],
        search_provider: "arxiv",
      }}
    />
  ),
};
