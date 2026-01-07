import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ZaiTranscriptionConfig, ZaiTranscriptionConfigForm } from "aihappey-components";

const meta: Meta<typeof ZaiTranscriptionConfigForm> = {
  title: "Forms/Providers/Zai/TranscriptionConfigForm",
  component: ZaiTranscriptionConfigForm,
};

export default meta;
type Story = StoryObj<typeof ZaiTranscriptionConfigForm>;

const Template: React.FC<{ initial: ZaiTranscriptionConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<ZaiTranscriptionConfig>(initial);
  return <ZaiTranscriptionConfigForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const WithPrompt: Story = {
  render: () => (
    <Template
      initial={{
        prompt: "This is a meeting transcript. Use correct punctuation. Keep speaker names as-is.",
      }}
    />
  ),
};

export const WithHotwords: Story = {
  render: () => (
    <Template
      initial={{
        hotwords: ["Zai", "Aihappey", "Minimax", "GLM"],
      }}
    />
  ),
};

export const WithPromptAndHotwords: Story = {
  render: () => (
    <Template
      initial={{
        prompt: "This audio contains technical terminology. Prefer literal transcription.",
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

