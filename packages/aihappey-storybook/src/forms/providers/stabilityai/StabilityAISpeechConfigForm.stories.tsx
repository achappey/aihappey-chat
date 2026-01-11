import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  StabilityAISpeechConfigForm,
  type StabilityAISpeechConfig,
} from "aihappey-components";

const meta: Meta<typeof StabilityAISpeechConfigForm> = {
  title: "Forms/Providers/StabilityAI/SpeechConfigForm",
  component: StabilityAISpeechConfigForm,
};
export default meta;

type Story = StoryObj<typeof StabilityAISpeechConfigForm>;

const Template: React.FC<{ initial: StabilityAISpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<StabilityAISpeechConfig>(initial);
  return <StabilityAISpeechConfigForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const Populated: Story = {
  render: () => (
    <Template
      initial={{
        output_format: "mp3",
        duration: 30,
        seed: 0,
        steps: 50,
        cfg_scale: 7,
      }}
    />
  ),
};

