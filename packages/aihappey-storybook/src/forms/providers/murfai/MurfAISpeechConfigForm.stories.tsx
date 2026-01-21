import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  MurfAISpeechConfigForm,
  type MurfAISpeechConfig,
} from "aihappey-components";

const meta: Meta<typeof MurfAISpeechConfigForm> = {
  title: "Forms/Providers/MurfAI/SpeechConfigForm",
  component: MurfAISpeechConfigForm,
};

export default meta;
type Story = StoryObj<typeof MurfAISpeechConfigForm>;

const Template: React.FC<{ initial: MurfAISpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<MurfAISpeechConfig>(initial);
  return <MurfAISpeechConfigForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const Gen2WithBase64Wav: Story = {
  render: () => (
    <Template
      initial={{
        voiceId: "en-US-natalie",
        modelVersion: "GEN2",
        format: "WAV",
        encodeAsBase64: true,
        channelType: "MONO",
        sampleRate: 44100,
      }}
    />
  ),
};

export const WithPronunciationDictionary: Story = {
  render: () => (
    <Template
      initial={{
        voiceId: "natalie",
        pronunciationDictionary: {
          live: { type: "IPA", pronunciation: "laɪv" },
          "2022": { type: "SAY_AS", pronunciation: "twenty twenty two" },
        },
        pitch: 5,
        rate: -10,
        variation: 2,
      }}
    />
  ),
};

