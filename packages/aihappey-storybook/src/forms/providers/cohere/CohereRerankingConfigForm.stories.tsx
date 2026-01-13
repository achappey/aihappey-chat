import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  CohereRerankingConfigForm,
  type CohereRerankingConfig,
} from "aihappey-components";

const meta = {
  title: "Forms/Providers/Cohere/RerankingConfigForm",
  component: CohereRerankingConfigForm,
  args: {
    config: {},
    updateConfig: (() => {}) as any,
  },
  argTypes: {
    config: { control: "object" },
    updateConfig: { action: "change", control: false },
  },
} satisfies Meta<typeof CohereRerankingConfigForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const Controlled: React.FC<React.ComponentProps<typeof CohereRerankingConfigForm>> = (
  args
) => {
  const [config, setConfig] = useState<CohereRerankingConfig>(args.config);

  // reset when switching stories / controls
  useEffect(() => {
    setConfig(args.config);
  }, [args.config]);

  return (
    <CohereRerankingConfigForm
      {...args}
      config={config}
      updateConfig={(next) => {
        setConfig(next);
        args.updateConfig?.(next);
      }}
    />
  );
};

export const Default: Story = {
  args: { config: {} },
  render: (args) => <Controlled {...args} />,
};

export const WithMaxTokensPerDoc: Story = {
  args: {
    config: {
      max_tokens_per_doc: 512,
    },
  },
  render: (args) => <Controlled {...args} />,
};

export const WithPriority: Story = {
  args: {
    config: {
      priority: 1,
    },
  },
  render: (args) => <Controlled {...args} />,
};

export const FullyPopulated: Story = {
  args: {
    config: {
      max_tokens_per_doc: 512,
      priority: 1,
    },
  },
  render: (args) => <Controlled {...args} />,
};

