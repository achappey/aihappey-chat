import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  ElevenLabsTranscriptionConfig,
  ElevenLabsTranscriptionConfigForm,
} from "aihappey-components";

const meta: Meta<typeof ElevenLabsTranscriptionConfigForm> = {
  title: "Forms/Providers/ElevenLabs/TranscriptionConfigForm",
  component: ElevenLabsTranscriptionConfigForm,
};

export default meta;
type Story = StoryObj<typeof ElevenLabsTranscriptionConfigForm>;

const Template: React.FC<{ initial: ElevenLabsTranscriptionConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<ElevenLabsTranscriptionConfig>(initial);
  return <ElevenLabsTranscriptionConfigForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const WithLanguageAndTimestamps: Story = {
  render: () => (
    <Template
      initial={{
        language_code: "en",
        timestamps_granularity: "word",
        tag_audio_events: true,
      }}
    />
  ),
};

export const WithDiarization: Story = {
  render: () => (
    <Template
      initial={{
        diarize: true,
        num_speakers: 2,
        diarization_threshold: 0.22,
      }}
    />
  ),
};

