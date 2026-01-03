import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { PollinationsChatConfigForm } from "aihappey-components";

const meta: Meta<typeof PollinationsChatConfigForm> = {
  title: "Forms/Providers/Pollinations/PollinationsChatConfigForm",
  component: PollinationsChatConfigForm,
};

export default meta;
type Story = StoryObj<typeof PollinationsChatConfigForm>;

type WrapperProps = {
  config?: Record<string, unknown>;
};

const Wrapper: React.FC<WrapperProps> = ({ config }) => {
  const [state, setState] = useState<Record<string, unknown>>(config ?? {});

  return (
    <PollinationsChatConfigForm
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

export const MinimalEffort: Story = {
  render: () => (
    <Wrapper
      config={{
        reasoning_effort: "minimal",
      }}
    />
  ),
};

export const LowEffort: Story = {
  render: () => (
    <Wrapper
      config={{
        reasoning_effort: "low",
      }}
    />
  ),
};

export const MediumEffort: Story = {
  render: () => (
    <Wrapper
      config={{
        reasoning_effort: "medium",
      }}
    />
  ),
};

export const HighEffort: Story = {
  render: () => (
    <Wrapper
      config={{
        reasoning_effort: "high",
      }}
    />
  ),
};

export const InvalidValueClamped: Story = {
  render: () => (
    <Wrapper
      config={{
        reasoning_effort: "extreme", // will clamp to "minimal"
      }}
    />
  ),
};

export const SwitchingLive: Story = {
  render: () => (
    <Wrapper
      config={{
        reasoning_effort: "medium",
      }}
    />
  ),
};
