import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CohereChatConfigForm } from "aihappey-components";

const meta: Meta<typeof CohereChatConfigForm> = {
  title: "Forms/Providers/Cohere/CohereChatConfigForm",
  component: CohereChatConfigForm,
};
export default meta;

type Story = StoryObj<typeof CohereChatConfigForm>;

const Wrapper = (props: any) => {
  const [config, setConfig] = useState(props.config ?? {});
  return (
    <CohereChatConfigForm
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
        safety_mode: "none",
        prompt_truncation: "auto",
      }}
    />
  ),
};
