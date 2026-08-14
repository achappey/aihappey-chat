import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ModelContextClientSettingsForm } from "aihappey-components";

type ModelContextClientSettings = {
  toolTimeoutMinutes: number;
  resetTimeoutOnProgress: boolean;
};

const Wrapper = ({
  initialValue,
}: {
  initialValue?: ModelContextClientSettings;
}) => {
  const [value, setValue] = useState<ModelContextClientSettings>(
    initialValue ?? {
      toolTimeoutMinutes: 5,
      resetTimeoutOnProgress: true,
    }
  );

  return (
    <ModelContextClientSettingsForm
      value={value}
      onChangeTimeout={(minutes, resetOnProgress) =>
        setValue((prev) => ({
          ...prev,
          toolTimeoutMinutes: minutes,
          resetTimeoutOnProgress: resetOnProgress,
        }))
      }
      onToggleResetOnProgress={(enabled) =>
        setValue((prev) => ({ ...prev, resetTimeoutOnProgress: enabled }))
      }
    />
  );
};

const meta: Meta<typeof ModelContextClientSettingsForm> = {
  title: "Forms/Model Context/ModelContextClientSettingsForm",
  component: ModelContextClientSettingsForm,
};

export default meta;
type Story = StoryObj<typeof ModelContextClientSettingsForm>;

export const Default: Story = {
  render: () => <Wrapper />,
};

/**
 * MIN TIMEOUT — slider lower bound
 */
export const MinTimeout: Story = {
  render: () => (
    <Wrapper
      initialValue={{
        toolTimeoutMinutes: 1,
        resetTimeoutOnProgress: true,
      }}
    />
  ),
};

/**
 * MAX TIMEOUT — slider upper bound
 */
export const MaxTimeout: Story = {
  render: () => (
    <Wrapper
      initialValue={{
        toolTimeoutMinutes: 60,
        resetTimeoutOnProgress: false,
      }}
    />
  ),
};

export const ResetOnProgressOn: Story = {
  render: () => (
    <Wrapper
      initialValue={{
        toolTimeoutMinutes: 10,
        resetTimeoutOnProgress: true,
      }}
    />
  ),
};

export const ResetOnProgressOff: Story = {
  render: () => (
    <Wrapper
      initialValue={{
        toolTimeoutMinutes: 10,
        resetTimeoutOnProgress: false,
      }}
    />
  ),
};
