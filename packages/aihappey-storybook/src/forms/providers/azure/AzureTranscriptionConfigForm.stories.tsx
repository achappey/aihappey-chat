import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import {
  AzureTranscriptionConfigForm,
  type AzureTranscriptionConfig,
} from "aihappey-components";

const meta: Meta<typeof AzureTranscriptionConfigForm> = {
  title: "Forms/Providers/Azure/AzureTranscriptionConfigForm",
  component: AzureTranscriptionConfigForm,
};

export default meta;
type Story = StoryObj<typeof AzureTranscriptionConfigForm>;

const Wrapper: React.FC<{ initial?: AzureTranscriptionConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<AzureTranscriptionConfig>(initial ?? {});
  return <AzureTranscriptionConfigForm config={config} updateConfig={setConfig} />;
};

export const DefaultAuto: Story = {
  render: () => <Wrapper initial={{}} />,
};

export const EnglishUS: Story = {
  render: () => <Wrapper initial={{ language: "en-US" }} />,
};

export const DutchNL: Story = {
  render: () => <Wrapper initial={{ language: "nl-NL" }} />,
};

export const EdgeUnsetBackToAuto: Story = {
  render: () => <Wrapper initial={{ language: undefined }} />,
};

