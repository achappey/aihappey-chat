import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  StabilityAIImageForm,
  type StabilityAIImageConfig,
} from "aihappey-components";

const meta: Meta<typeof StabilityAIImageForm> = {
  title: "Forms/Providers/StabilityAI/StabilityAIImageForm",
  component: StabilityAIImageForm,
};
export default meta;

type Story = StoryObj<typeof StabilityAIImageForm>;

const Wrapper = (props: { config?: StabilityAIImageConfig }) => {
  const [config, setConfig] = useState<StabilityAIImageConfig>(props.config ?? {});
  return <StabilityAIImageForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Wrapper />,
};

export const Populated: Story = {
  render: () => (
    <Wrapper
      config={{
        style_preset: "anime",
        negative_prompt: "blurry, low quality",
      }}
    />
  ),
};

