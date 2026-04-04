import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { MessagesEndpointConfigForm } from "aihappey-components";

const Controlled = (args: React.ComponentProps<typeof MessagesEndpointConfigForm>) => {
  const [value, setValue] = useState(args.value ?? {});
  return <MessagesEndpointConfigForm {...args} value={value} onChange={setValue} />;
};

const meta = {
  title: "Forms/Endpoint Config/Messages",
  component: MessagesEndpointConfigForm,
  render: (args) => <Controlled {...args} />,
} satisfies Meta<typeof MessagesEndpointConfigForm>;

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
      top_p: 0.9,
      top_k: 40,
      service_tier: "auto",
      container: "container_123",
      inference_geo: "eu",
      stop_sequences: ["END", "STOP"],
      metadata: {
        user_id: "opaque-user-id",
      },
      output_config: {
        effort: "medium",
      },
      thinking: {
        type: "enabled",
        budget_tokens: 2048,
        display: "summarized",
      },
    },
  },
};

