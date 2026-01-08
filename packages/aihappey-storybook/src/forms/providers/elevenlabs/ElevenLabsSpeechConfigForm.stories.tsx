import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  ElevenLabsSpeechConfig,
  ElevenLabsSpeechConfigForm,
} from "aihappey-components";

const meta: Meta<typeof ElevenLabsSpeechConfigForm> = {
  title: "Forms/Providers/ElevenLabs/SpeechConfigForm",
  component: ElevenLabsSpeechConfigForm,
};

export default meta;
type Story = StoryObj<typeof ElevenLabsSpeechConfigForm>;

const Template: React.FC<{ initial: ElevenLabsSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<ElevenLabsSpeechConfig>(initial);
  return <ElevenLabsSpeechConfigForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const WithVoiceAndFormat: Story = {
  render: () => (
    <Template
      initial={{
        voice: "JBFqnCBsd6RMkjVDRZzb",
        output_format: "mp3_44100_128",
        enable_logging: true,
      }}
    />
  ),
};

export const WithVoiceSettings: Story = {
  render: () => (
    <Template
      initial={{
        voice: "JBFqnCBsd6RMkjVDRZzb",
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true,
        },
      }}
    />
  ),
};

