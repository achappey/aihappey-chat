import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  DeepgramTranscriptionConfigForm,
  type DeepgramTranscriptionConfig,
} from "aihappey-components";

const meta: Meta<typeof DeepgramTranscriptionConfigForm> = {
  title: "Forms/Providers/Deepgram/TranscriptionConfigForm",
  component: DeepgramTranscriptionConfigForm,
};

export default meta;
type Story = StoryObj<typeof DeepgramTranscriptionConfigForm>;

const Template: React.FC<{ initial: DeepgramTranscriptionConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<DeepgramTranscriptionConfig>(initial);
  return <DeepgramTranscriptionConfigForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const WithLanguageAndFormatting: Story = {
  render: () => (
    <Template
      initial={{
        language: "en",
        detect_language: true,
        punctuate: true,
        smart_format: true,
        paragraphs: true,
        utterances: true,
      }}
    />
  ),
};

export const WithDiarizationAndSignals: Story = {
  render: () => (
    <Template
      initial={{
        diarize: true,
        multichannel: true,
        detect_entities: true,
        topics: true,
        intents: true,
        sentiment: true,
        mip_opt_out: true,
        tag: ["storybook", "transcription"],
      }}
    />
  ),
};

