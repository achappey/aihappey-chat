import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  NovitaTranscriptionConfig,
  NovitaTranscriptionConfigForm,
} from "aihappey-components";

const meta: Meta<typeof NovitaTranscriptionConfigForm> = {
  title: "Forms/Providers/Novita/TranscriptionConfigForm",
  component: NovitaTranscriptionConfigForm,
};

export default meta;
type Story = StoryObj<typeof NovitaTranscriptionConfigForm>;

const Template: React.FC<{ initial: NovitaTranscriptionConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<NovitaTranscriptionConfig>(initial);
  return <NovitaTranscriptionConfigForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const WithPrompt: Story = {
  render: () => (
    <Template
      initial={{
        prompt:
          "This is a meeting transcript. Use correct punctuation. Keep speaker names as-is.",
      }}
    />
  ),
};

export const WithHotwords: Story = {
  render: () => (
    <Template
      initial={{
        hotwords: ["Novita", "Aihappey", "Minimax", "GLM"],
      }}
    />
  ),
};

export const WithPromptAndHotwords: Story = {
  render: () => (
    <Template
      initial={{
        prompt:
          "This audio contains technical terminology. Prefer literal transcription.",
        hotwords: ["Kubernetes", "TypeScript", "Vercel AI SDK"],
      }}
    />
  ),
};

export const WithManyHotwords: Story = {
  render: () => (
    <Template
      initial={{
        hotwords: Array.from({ length: 30 }).map((_, i) => `hotword-${i + 1}`),
      }}
    />
  ),
};

