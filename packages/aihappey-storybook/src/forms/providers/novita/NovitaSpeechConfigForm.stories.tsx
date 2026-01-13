import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { NovitaSpeechConfigForm, type NovitaSpeechConfig } from "aihappey-components";

const meta: Meta<typeof NovitaSpeechConfigForm> = {
  title: "Forms/Providers/Novita/SpeechConfigForm",
  component: NovitaSpeechConfigForm,
};

export default meta;
type Story = StoryObj<typeof NovitaSpeechConfigForm>;

const Template: React.FC<{ initial: NovitaSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<NovitaSpeechConfig>(initial);
  return <NovitaSpeechConfigForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const MinimaxSystemVoice: Story = {
  render: () => (
    <Template
      initial={{
        minimax: {
          systemVoice: "Wise_Woman",
          vol: 1.2,
          speed: 1.0,
          pitch: 0,
        },
      }}
    />
  ),
};

export const MinimaxClonedVoiceId: Story = {
  render: () => (
    <Template
      initial={{
        minimax: {
          clonedVoiceId: "cloned_voice_1234",
          voice_id: "cloned_voice_1234",
          vol: 1.0,
          speed: 1.1,
          pitch: -1,
        },
      }}
    />
  ),
};

export const GlmAndTxt2Speech: Story = {
  render: () => (
    <Template
      initial={{
        glm: {
          voice: "tongtong",
          volume: 1.0,
          speed: 1.0,
        },
        txt2speech: {
          voice_id: "Emily",
          volume: 1.4,
          speed: 1.2,
        },
      }}
    />
  ),
};

