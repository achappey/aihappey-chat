import type { Meta, StoryObj } from "@storybook/react";
import { SharedWarning } from "aihappey-components";

const meta = {
  title: "Alerts/SharedWarning",
  component: SharedWarning,
} satisfies Meta<typeof SharedWarning>;

export default meta;
type Story = StoryObj<typeof meta>;

const standardWarning = {
  type: "unsupported-setting",
  feature: "temperature",
  details: "Provider ignored this setting.",
} as unknown as React.ComponentProps<typeof SharedWarning>["warning"];

const otherWarning = {
  type: "other",
  message: "Something unexpected happened.",
} as unknown as React.ComponentProps<typeof SharedWarning>["warning"];

export const Default: Story = {
  args: {
    warning: standardWarning,
    dismiss: () => {},
  },
};

export const OtherTypeMessage: Story = {
  args: {
    warning: otherWarning,
    dismiss: () => {},
  },
};

