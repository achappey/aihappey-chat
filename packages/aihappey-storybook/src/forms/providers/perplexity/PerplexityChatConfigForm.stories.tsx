import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { PerplexityChatConfigForm } from "aihappey-components";

const models = [
  {
    id: "perplexity/sonar",
    name: "Sonar",
    type: "language",
    owned_by: "Perplexity",
    tags: [],
  },
  {
    id: "perplexity/sonar-pro",
    name: "Sonar Pro",
    type: "language",
    owned_by: "Perplexity",
    tags: [],
  },
  {
    id: "openai/gpt-4.1",
    name: "GPT-4.1",
    type: "language",
    owned_by: "OpenAI",
    tags: [],
  },
];

const meta: Meta<typeof PerplexityChatConfigForm> = {
  title: "Forms/Providers/Perplexity/PerplexityChatConfigForm",
  component: PerplexityChatConfigForm,
};
export default meta;

type Story = StoryObj<typeof PerplexityChatConfigForm>;

const Wrapper = (props: any) => {
  const [config, setConfig] = useState(props.config ?? {});
  return (
    <PerplexityChatConfigForm
      {...props}
      config={config}
      updateConfig={setConfig}
    />
  );
};

export const Default: Story = {
  render: () => <Wrapper models={models} />,
};

export const Populated: Story = {
  render: () => (
    <Wrapper
      models={models}
      config={{
        return_citations: true,
        search_domain_filter: ["example.com"],
        reasoning: { effort: "high" },
        instructions: "You are a research agent.",
        language_preference: "en",
        max_output_tokens: 2048,
        max_steps: 4,
        models: ["sonar", "sonar-pro"],
      }}
    />
  ),
};
