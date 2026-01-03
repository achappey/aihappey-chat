import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TogetherImageConfigForm } from "aihappey-components";

const meta: Meta<typeof TogetherImageConfigForm> = {
  title: "Forms/Providers/Together/TogetherImageConfigForm",
  component: TogetherImageConfigForm,
};
export default meta;

type Story = StoryObj<typeof TogetherImageConfigForm>;

const Wrapper = (props: any) => {
  const [config, setConfig] = useState(props.config ?? {});
  return <TogetherImageConfigForm {...props} config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Wrapper />,
};

export const Populated: Story = {
  render: () => (
    <Wrapper
      config={{
        steps: 30,
        guidance_scale: 6.5,
        disable_safety_checker: true,
        negative_prompt: "blurry, low quality",
      }}
    />
  ),
};