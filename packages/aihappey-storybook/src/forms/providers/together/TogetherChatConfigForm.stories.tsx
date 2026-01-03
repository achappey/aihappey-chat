import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { TogetherChatConfigForm } from "aihappey-components";

const meta: Meta<typeof TogetherChatConfigForm> = {
  title: "Forms/Providers/Together/TogetherChatConfigForm",
  component: TogetherChatConfigForm,
};

export default meta;
type Story = StoryObj<typeof TogetherChatConfigForm>;

type WrapperProps = {
  config?: Record<string, unknown>;
};

const Wrapper: React.FC<WrapperProps> = ({ config }) => {
  const [state, setState] = useState<Record<string, unknown>>(config ?? {});

  return (
    <TogetherChatConfigForm
      config={state}
      updateConfig={setState}
    />
  );
};

export const Default: Story = {
  render: () => <Wrapper />,
};

export const Populated: Story = {
  render: () => (
    <Wrapper
      config={{
        reasoning_effort: "low",
      }}
    />
  ),
};
