import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  VoyageAIRerankingConfigForm,
  type VoyageAIRerankingConfig,
} from "aihappey-components";

const meta = {
  title: "Forms/Providers/VoyageAI/RerankingConfigForm",
  component: VoyageAIRerankingConfigForm,
  args: {
    config: {},
    updateConfig: (() => {}) as any,
  },
  argTypes: {
    config: { control: "object" },
    updateConfig: { action: "change", control: false },
  },
} satisfies Meta<typeof VoyageAIRerankingConfigForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const Controlled: React.FC<React.ComponentProps<typeof VoyageAIRerankingConfigForm>> = (
  args
) => {
  const [config, setConfig] = useState<VoyageAIRerankingConfig>(args.config);

  useEffect(() => {
    setConfig(args.config);
  }, [args.config]);

  return (
    <VoyageAIRerankingConfigForm
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

export const ReturnDocumentsEnabled: Story = {
  args: {
    config: {
      return_documents: true,
    },
  },
  render: (args) => <Controlled {...args} />,
};

export const WithTruncation: Story = {
  args: {
    config: {
      truncation: true,
    },
  },
  render: (args) => <Controlled {...args} />,
};

export const FullyPopulated: Story = {
  args: {
    config: {
      return_documents: true,
      truncation: true,
    },
  },
  render: (args) => <Controlled {...args} />,
};
