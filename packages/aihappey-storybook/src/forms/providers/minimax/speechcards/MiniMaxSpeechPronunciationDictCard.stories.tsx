import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  MiniMaxSpeechPronunciationDictCard,
  type MiniMaxSpeechConfig,
} from "aihappey-components";

const meta: Meta<typeof MiniMaxSpeechPronunciationDictCard> = {
  title: "Forms/Providers/MiniMax/SpeechCards/PronunciationDict",
  component: MiniMaxSpeechPronunciationDictCard,
};

export default meta;
type Story = StoryObj<typeof MiniMaxSpeechPronunciationDictCard>;

const Template: React.FC<{ initial?: MiniMaxSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<MiniMaxSpeechConfig>(initial ?? {});
  return <MiniMaxSpeechPronunciationDictCard config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template />,
};

export const Populated: Story = {
  render: () => (
    <Template
      initial={{
        pronunciation_dict: {
          tone: ["Omg/Oh my god"],
        },
      }}
    />
  ),
};

