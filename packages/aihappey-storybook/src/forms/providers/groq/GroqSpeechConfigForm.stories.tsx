import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { GroqSpeechConfigForm, type GroqSpeechConfig } from "aihappey-components";

const meta: Meta<typeof GroqSpeechConfigForm> = {
  title: "Forms/Providers/Groq/SpeechConfigForm",
  component: GroqSpeechConfigForm,
};

export default meta;
type Story = StoryObj<typeof GroqSpeechConfigForm>;

const Template: React.FC<{ initial: GroqSpeechConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<GroqSpeechConfig>(initial);
  return <GroqSpeechConfigForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const WithBuiltinVoice: Story = {
  render: () => (
    <Template
      initial={{
        voice: "autumn",
      }}
    />
  ),
};

export const WithUnknownVoicePreserved: Story = {
  render: () => (
    <Template
      initial={{
        voice: "custom_voice_id_123",
      }}
    />
  ),
};

