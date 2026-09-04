import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  StepFunSpeechConfigForm,
  type StepFunSpeechConfig,
} from "aihappey-components";

const meta: Meta<typeof StepFunSpeechConfigForm> = {
  title: "Forms/Providers/StepFun/SpeechConfigForm",
  component: StepFunSpeechConfigForm,
};

export default meta;
type Story = StoryObj<typeof StepFunSpeechConfigForm>;

const Controlled = ({ initial = {} }: { initial?: StepFunSpeechConfig }) => {
  const [config, setConfig] = useState<StepFunSpeechConfig>(initial);
  return <StepFunSpeechConfigForm config={config} updateConfig={setConfig} />;
};

export const Empty: Story = {
  render: () => <Controlled />,
};

export const Populated: Story = {
  render: () => (
    <Controlled
      initial={{
        volume: 1.2,
        sample_rate: 48000,
        pronunciation_map: {
          tone: ["LOL/laugh out loudly", "你好/ni3 hao3"],
        },
      }}
    />
  ),
};
