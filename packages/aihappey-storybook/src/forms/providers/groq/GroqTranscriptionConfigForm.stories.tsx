import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  GroqTranscriptionConfigForm,
  type GroqTranscriptionConfig,
} from "aihappey-components";

const meta: Meta<typeof GroqTranscriptionConfigForm> = {
  title: "Forms/Providers/Groq/TranscriptionConfigForm",
  component: GroqTranscriptionConfigForm,
};

export default meta;
type Story = StoryObj<typeof GroqTranscriptionConfigForm>;

const Template: React.FC<{ initial: GroqTranscriptionConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<GroqTranscriptionConfig>(initial);
  return (
    <GroqTranscriptionConfigForm config={config} updateConfig={setConfig} />
  );
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const WithLanguageAndPrompt: Story = {
  render: () => (
    <Template
      initial={{
        language: "en",
        prompt: "This is a meeting transcript. Use correct punctuation.",
      }}
    />
  ),
};

export const WithTemperatureAndTimestamps: Story = {
  render: () => (
    <Template
      initial={{
        temperature: 0.2,
        timestamp_granularities: ["segment", "word"],
      }}
    />
  ),
};

