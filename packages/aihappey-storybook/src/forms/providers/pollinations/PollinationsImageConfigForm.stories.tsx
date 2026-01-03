import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import {
  PollinationsImageConfigForm,
  type PollinationsImageConfig,
} from "aihappey-components";

const meta: Meta<typeof PollinationsImageConfigForm> = {
  title: "Forms/Providers/Pollinations/PollinationsImageConfigForm",
  component: PollinationsImageConfigForm,
};

export default meta;
type Story = StoryObj<typeof PollinationsImageConfigForm>;

type WrapperProps = {
  config?: PollinationsImageConfig;
};

const Wrapper: React.FC<WrapperProps> = ({ config }) => {
  const [state, setState] = useState<PollinationsImageConfig>(
    config ?? {}
  );

  return (
    <PollinationsImageConfigForm
      config={state}
      updateConfig={setState}
    />
  );
};

/* ------------------------------------------------------------------ */
/* Stories                                                             */
/* ------------------------------------------------------------------ */

export const Default: Story = {
  render: () => <Wrapper />,
};

export const EnhanceOnly: Story = {
  render: () => (
    <Wrapper
      config={{
        enhance: true,
      }}
    />
  ),
};

export const PrivateOnly: Story = {
  render: () => (
    <Wrapper
      config={{
        private: true,
      }}
    />
  ),
};

export const EnhanceAndPrivate: Story = {
  render: () => (
    <Wrapper
      config={{
        enhance: true,
        private: true,
      }}
    />
  ),
};

export const ToggleLive: Story = {
  render: () => (
    <Wrapper
      config={{
        enhance: false,
        private: false,
      }}
    />
  ),
};
