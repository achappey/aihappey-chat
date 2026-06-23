import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type SwitchStoryArgs = {
  id?: string;
  label?: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  required?: boolean;
  size?: string;
};

const SwitchStory = (args: SwitchStoryArgs) => {
  const { Switch } = useTheme() as unknown as Pick<AihUiTheme, "Switch">;
  const [checked, setChecked] = useState(args.checked);

  useEffect(() => {
    setChecked(args.checked);
  }, [args.checked]);

  return <Switch {...args} checked={checked} onChange={setChecked} />;
};

const meta = {
  title: "Switch",
  component: SwitchStory,
  argTypes: {
    label: { control: { type: "text" } },
    hint: { control: { type: "text" } },
    checked: { control: { type: "boolean" } },
    disabled: { control: { type: "boolean" } },
    required: { control: { type: "boolean" } },
    size: { control: { type: "select" }, options: ["small", "medium", "large"] },
  },
  args: {
    id: "switch-1",
    label: "Enable Feature",
    hint: "This toggles a sample feature flag.",
    checked: false,
    disabled: false,
    size: "medium",
  },
} satisfies Meta<typeof SwitchStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

