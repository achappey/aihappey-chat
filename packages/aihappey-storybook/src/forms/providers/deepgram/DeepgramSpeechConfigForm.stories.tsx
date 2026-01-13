import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  DeepgramSpeechConfigForm,
  type DeepgramSpeechConfig,
} from "aihappey-components";

const meta: Meta<typeof DeepgramSpeechConfigForm> = {
  title: "Forms/Providers/Deepgram/SpeechConfigForm",
  component: DeepgramSpeechConfigForm,
};

export default meta;
type Story = StoryObj<typeof DeepgramSpeechConfigForm>;

const Template: React.FC<{ initial: DeepgramSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<DeepgramSpeechConfig>(initial);
  return <DeepgramSpeechConfigForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const Mp3WithCallbackAndTags: Story = {
  render: () => (
    <Template
      initial={{
        encoding: "mp3",
        bit_rate: 48000,
        mip_opt_out: true,
        callback: "https://example.com/webhook",
        callback_method: "POST",
        tag: ["storybook", "speech"],
      }}
    />
  ),
};

export const Linear16WavWithSampleRate: Story = {
  render: () => (
    <Template
      initial={{
        encoding: "linear16",
        container: "wav",
        sample_rate: 16000,
        mip_opt_out: false,
      }}
    />
  ),
};

