import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { ChatCompletionsEndpointConfigForm } from "aihappey-components";

const Controlled = (args: React.ComponentProps<typeof ChatCompletionsEndpointConfigForm>) => {
  const [value, setValue] = useState(args.value ?? {});
  return <ChatCompletionsEndpointConfigForm {...args} value={value} onChange={setValue} />;
};

const meta = {
  title: "Forms/Endpoint Config/Chat Completions",
  component: ChatCompletionsEndpointConfigForm,
  render: (args) => <Controlled {...args} />,
} satisfies Meta<typeof ChatCompletionsEndpointConfigForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: {},
  },
};

export const Populated: Story = {
  args: {
    value: {
      stream: true,
      n: 2,
      top_p: 0.9,
      presence_penalty: 0.2,
      frequency_penalty: 0.1,
      store: true,
      parallel_tool_calls: true,
      user: "demo-user",
      service_tier: "default",
      reasoning_effort: "medium",
      verbosity: "medium",
    },
  },
};

