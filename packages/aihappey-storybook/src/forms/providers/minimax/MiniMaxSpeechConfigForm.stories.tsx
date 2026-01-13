import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  MiniMaxSpeechConfigForm,
  type MiniMaxSpeechConfig,
} from "aihappey-components";

const meta: Meta<typeof MiniMaxSpeechConfigForm> = {
  title: "Forms/Providers/MiniMax/SpeechConfigForm",
  component: MiniMaxSpeechConfigForm,
};

export default meta;
type Story = StoryObj<typeof MiniMaxSpeechConfigForm>;

const Template: React.FC<{ initial?: MiniMaxSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<MiniMaxSpeechConfig>(initial ?? {});
  return <MiniMaxSpeechConfigForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template />,
};

export const Populated: Story = {
  render: () => (
    <Template
      initial={{
        language_boost: "auto",
        subtitle_enable: true,
        lyrics: "Never gonna give you up\nNever gonna let you down",
        voice_setting: {
          voice_id: "English_Graceful_Lady",
          speed: 1.1,
          vol: 1.0,
          pitch: 0,
          emotion: "calm",
          text_normalization: true,
          latex_read: false,
        },
        audio_setting: {
          format: "mp3",
          sample_rate: 32000,
          bitrate: 128000,
          channel: 1,
          force_cbr: true,
        },
        pronunciation_dict: {
          tone: ["Omg/Oh my god"],
        },
        voice_modify: {
          pitch: 10,
          intensity: -10,
          timbre: 5,
          sound_effects: "spacious_echo",
        },
      }}
    />
  ),
};

