import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  FireworksTranscriptionConfig,
  FireworksTranscriptionConfigForm,
} from "aihappey-components";

const meta: Meta<typeof FireworksTranscriptionConfigForm> = {
  title: "Forms/Providers/Fireworks/TranscriptionConfigForm",
  component: FireworksTranscriptionConfigForm,
};

export default meta;
type Story = StoryObj<typeof FireworksTranscriptionConfigForm>;

const Template: React.FC<{ initial: FireworksTranscriptionConfig }> = ({
  initial,
}) => {
  const [config, setConfig] = useState<FireworksTranscriptionConfig>(initial);

  return <FireworksTranscriptionConfigForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const LanguageAndPrompt: Story = {
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
        temperature: 0.35,
      }}
    />
  ),
};

export const WithTimestampGranularities: Story = {
  render: () => (
    <Template
      initial={{
        timestamp_granularities: ["segment", "word"],
      }}
    />
  ),
};

export const WithDiarizationEnabled: Story = {
  render: () => (
    <Template
      initial={{
        diarize: true,
        // Fireworks diarization requires word-level timestamps.
        timestamp_granularities: ["segment", "word"],
        min_speakers: 1,
        max_speakers: 3,
      }}
    />
  ),
};

export const WithAudioProcessingOptions: Story = {
  render: () => (
    <Template
      initial={{
        vad_model: "silero",
        alignment_model: "mms_fa",
        preprocessing: "dynamic",
      }}
    />
  ),
};

