import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  TogetherSpeechConfigForm,
  type TogetherSpeechConfig,
} from "aihappey-components";

const meta: Meta<typeof TogetherSpeechConfigForm> = {
  title: "Forms/Providers/Together/TogetherSpeechConfigForm",
  component: TogetherSpeechConfigForm,
  args: {
    config: {},
    updateConfig: (() => {}) as any,
  },
  argTypes: {
    config: { control: "object" },
    updateConfig: { action: "change", control: false },
  },
};

export default meta;
type Story = StoryObj<typeof TogetherSpeechConfigForm>;

const Controlled: React.FC<React.ComponentProps<typeof TogetherSpeechConfigForm>> = (
  args
) => {
  const [config, setConfig] = useState<TogetherSpeechConfig>(args.config);

  return (
    <TogetherSpeechConfigForm
      {...args}
      config={config}
      updateConfig={(next) => {
        setConfig(next);
        args.updateConfig?.(next);
      }}
    />
  );
};

export const Default: Story = {
  render: (args) => <Controlled {...args} />,
};

export const Populated: Story = {
  render: (args) => <Controlled {...args} config={{
    response_format: "wav",
    sample_rate: 16000,
    response_encoding: "pcm_mulaw",
    language: "fr",
    canopylabs: { voice: "Orpheus-Alpha" },
    hexgrad: { voice: "Kokoro-Beta" },
    cartesia: { voice: "Cartesia-Gamma" },
  }} />,
};
