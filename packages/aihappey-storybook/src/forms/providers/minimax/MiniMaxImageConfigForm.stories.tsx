import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import {
  MiniMaxImageConfig,
  MiniMaxImageConfigForm,
} from "aihappey-components";

const meta: Meta<typeof MiniMaxImageConfigForm> = {
  title: "Forms/Providers/MiniMax/MiniMaxImageConfigForm",
  component: MiniMaxImageConfigForm,
};

export default meta;
type Story = StoryObj<typeof MiniMaxImageConfigForm>;

const Wrapper = ({ initial }: { initial: MiniMaxImageConfig }) => {
  const [config, setConfig] = useState(initial);
  return <MiniMaxImageConfigForm config={config} updateConfig={setConfig} />;
};

export const Disabled: Story = {
  render: () => <Wrapper initial={{ prompt_optimizer: false }} />,
};

export const Enabled: Story = {
  render: () => <Wrapper initial={{ prompt_optimizer: true }} />,
};
