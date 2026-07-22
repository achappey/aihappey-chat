import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

import { CortecsChatConfigForm, type CortecsChatConfig } from "aihappey-components";

const meta: Meta<typeof CortecsChatConfigForm> = {
  title: "Forms/Providers/Cortecs/CortecsChatConfigForm",
  component: CortecsChatConfigForm,
};

export default meta;
type Story = StoryObj<typeof CortecsChatConfigForm>;

const Wrapper = ({ config }: { config: CortecsChatConfig }) => {
  const [state, setState] = useState(config);

  return <CortecsChatConfigForm config={state} updateConfig={setState} />;
};

export const Default: Story = {
  render: () => (
    <Wrapper
      config={{
        preference: "balanced",
        eu_native: false,
        allow_zero_data_retention: false,
        enable_model_fallback: true,
        parallel_tool_calls: true,
      }}
    />
  ),
};
