import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  FireworksRerankingConfig,
  FireworksRerankingConfigForm,
} from "aihappey-components";

const meta: Meta<typeof FireworksRerankingConfigForm> = {
  title: "Forms/Providers/Fireworks/RerankingConfigForm",
  component: FireworksRerankingConfigForm,
};

export default meta;
type Story = StoryObj<typeof FireworksRerankingConfigForm>;

const Template: React.FC<{ initial: FireworksRerankingConfig }> = ({
  initial,
}) => {
  const [config, setConfig] = useState<FireworksRerankingConfig>(initial);

  return (
    <FireworksRerankingConfigForm
      config={config}
      updateConfig={setConfig}
    />
  );
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const WithTask: Story = {
  render: () => (
    <Template
      initial={{
        task:
          "Given a user query, rank the documents by how well they answer the query.",
      }}
    />
  ),
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

export const FullyPopulated: Story = {
  render: () => (
    <Template
      initial={{
        task:
          "Given a web search query, retrieve relevant passages that answer the query.",
        return_documents: true,
      }}
    />
  ),
};

