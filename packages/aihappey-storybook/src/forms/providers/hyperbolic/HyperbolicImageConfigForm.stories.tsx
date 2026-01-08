import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  HyperbolicImageConfigForm,
  type HyperbolicImageConfig,
} from "aihappey-components";

const meta: Meta<typeof HyperbolicImageConfigForm> = {
  title: "Forms/Providers/Hyperbolic/HyperbolicImageConfigForm",
  component: HyperbolicImageConfigForm,
};

export default meta;
type Story = StoryObj<typeof HyperbolicImageConfigForm>;

const Wrapper = (props: { config?: HyperbolicImageConfig }) => {
  const [config, setConfig] = useState<HyperbolicImageConfig>(props.config ?? {});
  return <HyperbolicImageConfigForm config={config} updateConfig={setConfig} />;
};

export const Default: Story = {
  render: () => <Wrapper />,
};

export const Filled: Story = {
  render: () => (
    <Wrapper
      config={{
        steps: 30,
        cfg_scale: 6.5,
        negative_prompt: "blurry, low quality",
      }}
    />
  ),
};

