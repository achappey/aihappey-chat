import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  MiniMaxSpeechVoiceModifyCard,
  type MiniMaxSpeechConfig,
} from "aihappey-components";

const meta: Meta<typeof MiniMaxSpeechVoiceModifyCard> = {
  title: "Forms/Providers/MiniMax/SpeechCards/VoiceModify",
  component: MiniMaxSpeechVoiceModifyCard,
};

export default meta;
type Story = StoryObj<typeof MiniMaxSpeechVoiceModifyCard>;

const Template: React.FC<{ initial?: MiniMaxSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<MiniMaxSpeechConfig>(initial ?? {});
  return <MiniMaxSpeechVoiceModifyCard config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template />,
};

export const Populated: Story = {
  render: () => (
    <Template
      initial={{
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

