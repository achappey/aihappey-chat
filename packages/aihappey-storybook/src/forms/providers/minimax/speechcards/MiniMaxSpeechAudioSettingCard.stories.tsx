import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  MiniMaxSpeechAudioSettingCard,
  type MiniMaxSpeechConfig,
} from "aihappey-components";

const meta: Meta<typeof MiniMaxSpeechAudioSettingCard> = {
  title: "Forms/Providers/MiniMax/SpeechCards/AudioSetting",
  component: MiniMaxSpeechAudioSettingCard,
};

export default meta;
type Story = StoryObj<typeof MiniMaxSpeechAudioSettingCard>;

const Template: React.FC<{ initial?: MiniMaxSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<MiniMaxSpeechConfig>(initial ?? {});
  return <MiniMaxSpeechAudioSettingCard config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template />,
};

export const Populated: Story = {
  render: () => (
    <Template
      initial={{
        audio_setting: {
          format: "mp3",
          sample_rate: 32000,
          bitrate: 128000,
          channel: 1,
          force_cbr: true,
        },
      }}
    />
  ),
};

