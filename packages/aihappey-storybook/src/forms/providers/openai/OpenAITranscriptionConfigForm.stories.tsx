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
      // Storybook: no persistence layer, so Known Speakers sample ops are disabled.
      getSampleInfo={undefined}
      onUploadSample={undefined}
      onClearSample={undefined}
      onRenameSample={undefined}
      onPreviewSample={undefined}
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

export const WithTemperatureAndGranularities: Story = {
  render: () => (
    <Template
      initial={{
        language: "en",
        temperature: 0.2,
        timestamp_granularities: ["segment", "word"],
      }}
    />
  ),
};
