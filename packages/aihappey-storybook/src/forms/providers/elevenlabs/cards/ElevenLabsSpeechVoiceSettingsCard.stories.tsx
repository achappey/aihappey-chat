import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  ElevenLabsSpeechConfig,
  ElevenLabsSpeechVoiceSettingsCard,
} from "aihappey-components";

const meta: Meta<typeof ElevenLabsSpeechVoiceSettingsCard> = {
  title: "Forms/Providers/ElevenLabs/SpeechConfigForm/Cards/VoiceSettings",
  component: ElevenLabsSpeechVoiceSettingsCard,
};

export default meta;
type Story = StoryObj<typeof ElevenLabsSpeechVoiceSettingsCard>;

const Template: React.FC<{ initial: ElevenLabsSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<ElevenLabsSpeechConfig>(initial);
  return (
    <ElevenLabsSpeechVoiceSettingsCard config={config} updateConfig={setConfig} />
  );
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

