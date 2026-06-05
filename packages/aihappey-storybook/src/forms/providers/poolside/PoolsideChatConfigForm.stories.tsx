import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

import { PoolsideChatConfigForm } from "aihappey-components";

const meta: Meta<typeof PoolsideChatConfigForm> = {
  title: "Forms/Providers/Poolside/PoolsideChatConfigForm",
  component: PoolsideChatConfigForm,
};

export default meta;
type Story = StoryObj<typeof PoolsideChatConfigForm>;

type WrapperProps = {
  config?: Record<string, unknown>;
};

const Wrapper: React.FC<WrapperProps> = ({ config }) => {
  const [state, setState] = useState<Record<string, unknown>>(
    config ?? { reasoning: { effort: "medium" } }
  );

  return <PoolsideChatConfigForm config={state} updateConfig={setState} />;
};

export const Default: Story = {
  render: () => <Wrapper />,
};

export const Disabled: Story = {
  render: () => <Wrapper config={{}} />,
};

export const HighEffort: Story = {
  render: () => (
    <Wrapper
      config={{
        reasoning: {
          effort: "high",
        },
      }}
    />
  ),
};

