import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  ElevenLabsSpeechConfig,
  ElevenLabsSpeechMusicCard,
} from "aihappey-components";

const meta: Meta<typeof ElevenLabsSpeechMusicCard> = {
  title: "Forms/Providers/ElevenLabs/SpeechConfigForm/Cards/Music",
  component: ElevenLabsSpeechMusicCard,
};

export default meta;
type Story = StoryObj<typeof ElevenLabsSpeechMusicCard>;

const Template: React.FC<{ initial: ElevenLabsSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<ElevenLabsSpeechConfig>(initial);
  return <ElevenLabsSpeechMusicCard config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

