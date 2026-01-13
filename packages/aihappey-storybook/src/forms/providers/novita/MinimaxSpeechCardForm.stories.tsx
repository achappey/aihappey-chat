import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  MinimaxSpeechCardForm,
  type NovitaSpeechConfig,
  type NovitaMinimaxSpeechConfig,
} from "aihappey-components";

const meta: Meta<typeof MinimaxSpeechCardForm> = {
  title: "Forms/Providers/Novita/SpeechCards/Minimax",
  component: MinimaxSpeechCardForm,
};

export default meta;
type Story = StoryObj<typeof MinimaxSpeechCardForm>;

const Template: React.FC<{ initial: NovitaSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<NovitaSpeechConfig>(initial);
  return <MinimaxSpeechCardForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const SystemVoice: Story = {
  render: () => (
    <Template
      initial={{
        minimax: {
          systemVoice: "Wise_Woman",
          vol: 1.2,
          speed: 1.0,
          pitch: 0,
        } satisfies NovitaMinimaxSpeechConfig,
      }}
    />
  ),
};

export const ClonedVoiceId: Story = {
  render: () => (
    <Template
      initial={{
        minimax: {
          clonedVoiceId: "cloned_voice_1234",
          voice_id: "cloned_voice_1234",
          vol: 1.0,
          speed: 1.1,
          pitch: -1,
        } satisfies NovitaMinimaxSpeechConfig,
      }}
    />
  ),
};

