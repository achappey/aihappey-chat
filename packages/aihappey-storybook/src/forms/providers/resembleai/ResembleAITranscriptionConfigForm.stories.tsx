import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  ResembleAITranscriptionConfig,
  ResembleAITranscriptionConfigForm,
} from "aihappey-components";

const meta: Meta<typeof ResembleAITranscriptionConfigForm> = {
  title: "Forms/Providers/ResembleAI/TranscriptionConfigForm",
  component: ResembleAITranscriptionConfigForm,
};

export default meta;
type Story = StoryObj<typeof ResembleAITranscriptionConfigForm>;

const Template: React.FC<{ initial: ResembleAITranscriptionConfig }> = ({
  initial,
}) => {
  const [config, setConfig] = useState<ResembleAITranscriptionConfig>(initial);

  return (
    <ResembleAITranscriptionConfigForm
      config={config}
      updateConfig={setConfig}
    />
  );
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const WithQuery: Story = {
  render: () => (
    <Template
      initial={{
        query:
          "Summarize key action items and decisions. Identify names and dates.",
      }}
    />
  ),
};

