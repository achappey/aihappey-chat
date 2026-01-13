import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  MiniMaxSpeechVoiceSettingCard,
  type MiniMaxSpeechConfig,
} from "aihappey-components";

const meta: Meta<typeof MiniMaxSpeechVoiceSettingCard> = {
  title: "Forms/Providers/MiniMax/SpeechCards/VoiceSetting",
  component: MiniMaxSpeechVoiceSettingCard,
};

export default meta;
type Story = StoryObj<typeof MiniMaxSpeechVoiceSettingCard>;

const Template: React.FC<{ initial?: MiniMaxSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<MiniMaxSpeechConfig>(initial ?? {});
  return <MiniMaxSpeechVoiceSettingCard config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template />,
};

export const Populated: Story = {
  render: () => (
    <Template
      initial={{
        voice_setting: {
          voice_id: "English_Graceful_Lady",
          speed: 1.1,
          vol: 1.0,
          pitch: 0,
          emotion: "calm",
          text_normalization: true,
          latex_read: false,
        },
      }}
    />
  ),
};

