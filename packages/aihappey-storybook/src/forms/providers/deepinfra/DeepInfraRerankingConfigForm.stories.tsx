import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  DeepInfraRerankingConfigForm,
  type DeepInfraRerankingConfig,
} from "aihappey-components";

const meta: Meta<typeof DeepInfraRerankingConfigForm> = {
  title: "Forms/Providers/DeepInfra/RerankingConfigForm",
  component: DeepInfraRerankingConfigForm,
};

export default meta;
type Story = StoryObj<typeof DeepInfraRerankingConfigForm>;

const Template: React.FC<{ initial: DeepInfraRerankingConfig }> = ({ initial }) => {
  const [config, setConfig] = useState<DeepInfraRerankingConfig>(initial);
  return <DeepInfraRerankingConfigForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Template initial={{}} />,
};

export const WithInstruction: Story = {
  render: () => (
    <Template
      initial={{
        instruction:
          "Prefer relevance to the user query; penalize duplicates and boilerplate. Respond in the same language as the query.",
      }}
    />
  ),
};

export const PriorityServiceTier: Story = {
  render: () => (
    <Template
      initial={{
        service_tier: "priority",
      }}
    />
  ),
};

