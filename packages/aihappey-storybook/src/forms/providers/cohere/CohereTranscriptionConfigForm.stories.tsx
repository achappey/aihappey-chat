import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  CohereTranscriptionConfigForm,
  type CohereTranscriptionConfig,
} from "aihappey-components";

const meta: Meta<typeof CohereTranscriptionConfigForm> = {
  title: "Forms/Providers/Cohere/TranscriptionConfigForm",
  component: CohereTranscriptionConfigForm,
};

export default meta;
type Story = StoryObj<typeof CohereTranscriptionConfigForm>;

const Template: React.FC<{ initial: CohereTranscriptionConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<CohereTranscriptionConfig>(initial);
  return <CohereTranscriptionConfigForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const WithLanguage: Story = {
  render: () => <Template initial={{ language: "en" }} />,
};

export const WithLanguageAndTemperature: Story = {
  render: () => <Template initial={{ language: "en", temperature: 0.2 }} />,
};

