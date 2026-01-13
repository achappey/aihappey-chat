import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { MiniMaxSpeechMusicCard, type MiniMaxSpeechConfig } from "aihappey-components";

const meta: Meta<typeof MiniMaxSpeechMusicCard> = {
  title: "Forms/Providers/MiniMax/SpeechCards/Music",
  component: MiniMaxSpeechMusicCard,
};

export default meta;
type Story = StoryObj<typeof MiniMaxSpeechMusicCard>;

const Template: React.FC<{ initial?: MiniMaxSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<MiniMaxSpeechConfig>(initial ?? {});
  return <MiniMaxSpeechMusicCard config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template />, 
};

export const Populated: Story = {
  render: () => (
    <Template
      initial={{
        lyrics: "Never gonna give you up\nNever gonna let you down",
      }}
    />
  ),
};

