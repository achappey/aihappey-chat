import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { JinaRerankingConfig, JinaRerankingConfigForm } from "aihappey-components";

const meta: Meta<typeof JinaRerankingConfigForm> = {
  title: "Forms/Providers/Jina/RerankingConfigForm",
  component: JinaRerankingConfigForm,
};

export default meta;
type Story = StoryObj<typeof JinaRerankingConfigForm>;

const Template: React.FC<{ initial: JinaRerankingConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<JinaRerankingConfig>(initial);

  return <JinaRerankingConfigForm config={config} updateConfig={setConfig} />;
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

export const WithMaxDocLength: Story = {
  render: () => (
    <Template
      initial={{
        max_doc_length: 512,
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
        max_doc_length: 512,
        return_embeddings: true,
      }}
    />
  ),
};

