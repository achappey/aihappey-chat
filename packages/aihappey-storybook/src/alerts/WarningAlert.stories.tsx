import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { WarningAlert } from "aihappey-components";

const meta = {
  title: "Alerts/WarningAlert",
  component: WarningAlert,
  args: {
    warning: { id: "1", message: "This is a warning" },
    dismissWarning: () => {},
  },
  argTypes: {
    warning: { control: "object" },
    dismissWarning: { action: "dismissWarning", control: false },
  },
} satisfies Meta<typeof WarningAlert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DismissInteraction: Story = {
  render: (args) => (
    <WarningAlert
      warning={args.warning}
      dismissWarning={args.dismissWarning}
    />
  ),
};
