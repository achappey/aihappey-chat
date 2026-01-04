import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

import { SambanovaChatConfigForm } from "aihappey-components";

const meta: Meta<typeof SambanovaChatConfigForm> = {
  title: "Forms/Providers/SambaNova/SambanovaChatConfigForm",
  component: SambanovaChatConfigForm,
};

export default meta;
type Story = StoryObj<typeof SambanovaChatConfigForm>;

type WrapperProps = {
  config?: Record<string, unknown>;
};

const Wrapper: React.FC<WrapperProps> = ({ config }) => {
  const [state, setState] = useState<Record<string, unknown>>(config ?? {});

  return <SambanovaChatConfigForm config={state} updateConfig={setState} />;
};

export const Default: Story = {
  render: () => <Wrapper />,
};

export const Populated: Story = {
  render: () => (
    <Wrapper
      config={{
        reasoning_effort: "medium",
        parallel_tool_calls: true,
        chat_template_kwargs: {
          enable_thinking: true,
        },
      }}
    />
  ),
};
