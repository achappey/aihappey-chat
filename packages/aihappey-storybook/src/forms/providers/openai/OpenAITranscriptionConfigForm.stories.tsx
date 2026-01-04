// OpenAIITranscriptionConfigForm.stories.tsx
import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { OpenAIITranscriptionConfig, OpenAIITranscriptionConfigForm } from "aihappey-components";

const meta: Meta<typeof OpenAIITranscriptionConfigForm> = {
  title: "Forms/Providers/OpenAI/TranscriptionConfigForm",
  component: OpenAIITranscriptionConfigForm,
};

export default meta;

type Story = StoryObj<typeof OpenAIITranscriptionConfigForm>;

const Template: React.FC<{ initial: OpenAIITranscriptionConfig }> = ({
  initial,
}) => {
  const [config, setConfig] =
    useState<OpenAIITranscriptionConfig>(initial);

  return (
    <OpenAIITranscriptionConfigForm
      config={config}
      updateConfig={setConfig}
    />
  );
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const English: Story = {
  render: () => (
    <Template
      initial={{
        language: "en",
      }}
    />
  ),
};

export const DutchWithPrompt: Story = {
  render: () => (
    <Template
      initial={{
        language: "nl",
        prompt: "This is a meeting transcript. Use correct punctuation.",
      }}
    />
  ),
};

export const PromptOnly: Story = {
  render: () => (
    <Template
      initial={{
        prompt:
          "This audio contains technical terminology. Prefer literal transcription.",
      }}
    />
  ),
};
