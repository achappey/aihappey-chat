import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  Txt2SpeechSpeechCardForm,
  type NovitaSpeechConfig,
  type NovitaTxt2SpeechSpeechConfig,
} from "aihappey-components";

const meta: Meta<typeof Txt2SpeechSpeechCardForm> = {
  title: "Forms/Providers/Novita/SpeechCards/Text2Speech",
  component: Txt2SpeechSpeechCardForm,
};

export default meta;
type Story = StoryObj<typeof Txt2SpeechSpeechCardForm>;

const Template: React.FC<{ initial: NovitaSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<NovitaSpeechConfig>(initial);
  return <Txt2SpeechSpeechCardForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const Emily: Story = {
  render: () => (
    <Template
      initial={{
        txt2speech: {
          voice_id: "Emily",
          volume: 1.4,
          speed: 1.2,
        } satisfies NovitaTxt2SpeechSpeechConfig,
      }}
    />
  ),
};

