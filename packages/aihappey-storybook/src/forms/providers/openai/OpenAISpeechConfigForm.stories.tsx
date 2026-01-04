// OpenAISpeechConfigForm.stories.tsx
import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { OpenAISpeechConfig, OpenAISpeechConfigForm } from "aihappey-components";

const meta: Meta<typeof OpenAISpeechConfigForm> = {
  title: "Forms/Providers/OpenAI/SpeechConfigForm",
  component: OpenAISpeechConfigForm,
};

export default meta;

type Story = StoryObj<typeof OpenAISpeechConfigForm>;

const Template: React.FC<{ initial: OpenAISpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<OpenAISpeechConfig>(initial);

  return (
    <OpenAISpeechConfigForm
      config={config}
      updateConfig={setConfig}
    />
  );
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const BuiltinVoice: Story = {
  render: () => (
    <Template
      initial={{
        voice: "alloy",
        response_format: "mp3",
        speed: 1,
      }}
    />
  ),
};

export const CustomVoice: Story = {
  render: () => (
    <Template
      initial={{
        voice: { id: "voice_1234" },
        response_format: "wav",
        speed: 1.25,
      }}
    />
  ),
};

export const FastSpeech: Story = {
  render: () => (
    <Template
      initial={{
        voice: "nova",
        speed: 2,
      }}
    />
  ),
};

export const SlowSpeech: Story = {
  render: () => (
    <Template
      initial={{
        voice: "sage",
        speed: 0.5,
      }}
    />
  ),
};
