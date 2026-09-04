import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import {
  XAIImageConfig,
  XAIImageConfigForm,
} from "aihappey-components";

const meta: Meta<typeof XAIImageConfigForm> = {
  title: "Forms/Providers/XAI/XAIImageConfigForm",
  component: XAIImageConfigForm,
};

export default meta;
type Story = StoryObj<typeof XAIImageConfigForm>;

const Wrapper = ({ initial }: { initial: XAIImageConfig }) => {
  const [config, setConfig] = useState(initial);
  return <XAIImageConfigForm config={config} updateConfig={setConfig} />;
};

export const AutoQuality: Story = {
  render: () => <Wrapper initial={{ quality: "auto" }} />,
};

export const MediumQuality: Story = {
  render: () => <Wrapper initial={{ quality: "medium" }} />,
};
