import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  MistralTranscriptionConfig,
  MistralTranscriptionConfigForm,
} from "aihappey-components";

const meta: Meta<typeof MistralTranscriptionConfigForm> = {
  title: "Forms/Providers/Mistral/TranscriptionConfigForm",
  component: MistralTranscriptionConfigForm,
};

export default meta;
type Story = StoryObj<typeof MistralTranscriptionConfigForm>;

const Template: React.FC<{ initial: MistralTranscriptionConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<MistralTranscriptionConfig>(initial);
  return <MistralTranscriptionConfigForm config={config} updateConfig={setConfig} />;
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

export const WithTemperature: Story = {
  render: () => (
    <Template
      initial={{
        temperature: 0.25,
      }}
    />
  ),
};

export const WithTimestampsSegmentOnly: Story = {
  render: () => (
    <Template
      initial={{
        timestamp_granularities: ["segment"],
      }}
    />
  ),
};

