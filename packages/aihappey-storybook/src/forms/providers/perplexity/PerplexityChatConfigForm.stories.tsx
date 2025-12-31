import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { PerplexityChatConfigForm } from "aihappey-components";

const meta: Meta<typeof PerplexityChatConfigForm> = {
  title: "Forms/Providers/Perplexity/PerplexityChatConfigForm",
  component: PerplexityChatConfigForm,
};
export default meta;

type Story = StoryObj<typeof PerplexityChatConfigForm>;

const Wrapper = (props: any) => {
  const [config, setConfig] = useState(props.config ?? {});
  return (
    <PerplexityChatConfigForm
      {...props}
      config={config}
      updateConfig={setConfig}
    />
  );
};

export const Default: Story = {
  render: () => <Wrapper />,
};

export const Populated: Story = {
  render: () => (
    <Wrapper
      config={{
        return_citations: true,
        search_domain_filter: ["example.com"],
      }}
    />
  ),
};
