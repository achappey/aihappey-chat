import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { WarningAlerts } from "aihappey-components";

const meta: Meta<typeof WarningAlerts> = {
  title: "Alerts/WarningAlerts",
  component: WarningAlerts,
  args: {
    warnings: [
      { id: "1", message: "First warning" },
      { id: "2", message: "Second warning" },
    ],
    dismissWarning: () => {},
  },
  argTypes: {
    warnings: { control: "object" },
    dismissWarning: { action: "dismissWarning", control: false },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DismissInteraction: Story = {
  render: (args) => (
    <WarningAlerts
      warnings={args.warnings}
      dismissWarning={args.dismissWarning}
    />
  ),
};
