import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import {
  TogetherRerankingConfigForm,
  type TogetherRerankingConfig,
} from "aihappey-components";

const meta: Meta<typeof TogetherRerankingConfigForm> = {
  title: "Forms/Providers/Together/TogetherRerankingConfigForm",
  component: TogetherRerankingConfigForm,
};

export default meta;
type Story = StoryObj<typeof TogetherRerankingConfigForm>;

const Wrapper: React.FC<{ config?: TogetherRerankingConfig }> = ({ config }) => {
  const [state, setState] = useState<TogetherRerankingConfig>(config ?? {});
  return <TogetherRerankingConfigForm config={state} updateConfig={setState} />;
};

export const Default: Story = {
  render: () => <Wrapper />,
};

export const Populated: Story = {
  render: () => (
    <Wrapper
      config={{
        return_documents: true,
        rank_fields: ["title", "body"],
      }}
    />
  ),
};
