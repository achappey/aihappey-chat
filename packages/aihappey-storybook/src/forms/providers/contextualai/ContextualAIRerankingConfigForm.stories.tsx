import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  ContextualAIRerankingConfigForm,
  type ContextualAIRerankingConfig,
} from "aihappey-components";

const meta = {
  title: "Forms/Providers/ContextualAI/RerankingConfigForm",
  component: ContextualAIRerankingConfigForm,
  args: {
    config: {},
    updateConfig: (() => {}) as any,
  },
  argTypes: {
    config: { control: "object" },
    updateConfig: { action: "change", control: false },
  },
} satisfies Meta<typeof ContextualAIRerankingConfigForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const Controlled: React.FC<React.ComponentProps<typeof ContextualAIRerankingConfigForm>> = (
  args
) => {
  const [config, setConfig] = useState<ContextualAIRerankingConfig>(args.config);

  // reset when switching stories / controls
  useEffect(() => {
    setConfig(args.config);
  }, [args.config]);

  return (
    <ContextualAIRerankingConfigForm
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

export const WithInstruction: Story = {
  args: {
    config: {
      instruction:
        "Rank results by direct relevance. Prefer official docs and de-duplicate similar passages.",
    },
  },
  render: (args) => <Controlled {...args} />,
};

export const Playground: Story = {
  render: (args) => <Controlled {...args} />,
};

