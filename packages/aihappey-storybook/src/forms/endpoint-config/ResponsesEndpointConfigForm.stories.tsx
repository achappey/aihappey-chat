import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { ResponsesEndpointConfigForm } from "aihappey-components";

const Controlled = (args: React.ComponentProps<typeof ResponsesEndpointConfigForm>) => {
  const [value, setValue] = useState(args.value ?? {});
  return <ResponsesEndpointConfigForm {...args} value={value} onChange={setValue} />;
};

const meta = {
  title: "Forms/Endpoint Config/Responses",
  component: ResponsesEndpointConfigForm,
  render: (args) => <Controlled {...args} />,
} satisfies Meta<typeof ResponsesEndpointConfigForm>;

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
      top_p: 0.95,
      parallel_tool_calls: true,
      max_tool_calls: 3,
      service_tier: "default",
      prompt_cache_key: "playground-cache-key",
      prompt_cache_retention: "24h",
      reasoning: {
        effort: "medium",
        summary: "auto",
      },
      text: {
        verbosity: "medium",
      },
    },
  },
};

