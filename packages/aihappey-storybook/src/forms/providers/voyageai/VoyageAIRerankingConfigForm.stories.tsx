import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  VoyageAIRerankingConfigForm,
  type VoyageAIRerankingConfig,
} from "aihappey-components";

const meta: Meta<typeof VoyageAIRerankingConfigForm> = {
  title: "Forms/Providers/VoyageAI/RerankingConfigForm",
  component: VoyageAIRerankingConfigForm,
};

export default meta;
type Story = StoryObj<typeof VoyageAIRerankingConfigForm>;

const Template: React.FC<{ initial: VoyageAIRerankingConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<VoyageAIRerankingConfig>(initial);
  return <VoyageAIRerankingConfigForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const ReturnDocumentsEnabled: Story = {
  render: () => (
    <Template
      initial={{
        return_documents: true,
      }}
    />
  ),
};

export const WithTruncation: Story = {
  render: () => (
    <Template
      initial={{
        truncation: true,
      }}
    />
  ),
};

export const FullyPopulated: Story = {
  render: () => (
    <Template
      initial={{
        return_documents: true,
        truncation: true,
      }}
    />
  ),
};

