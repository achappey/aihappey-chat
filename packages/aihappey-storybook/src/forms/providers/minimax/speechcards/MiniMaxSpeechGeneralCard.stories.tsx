import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  MiniMaxSpeechGeneralCard,
  type MiniMaxSpeechConfig,
} from "aihappey-components";

const meta: Meta<typeof MiniMaxSpeechGeneralCard> = {
  title: "Forms/Providers/MiniMax/SpeechCards/General",
  component: MiniMaxSpeechGeneralCard,
};

export default meta;
type Story = StoryObj<typeof MiniMaxSpeechGeneralCard>;

const Template: React.FC<{ initial?: MiniMaxSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<MiniMaxSpeechConfig>(initial ?? {});
  return <MiniMaxSpeechGeneralCard config={config} updateConfig={setConfig} />;
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
      }}
    />
  ),
};

