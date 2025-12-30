import type { Meta, StoryObj } from "@storybook/react";
import { CopyToClipboardButton } from "aihappey-components";

const meta = {
  title: "Buttons/CopyToClipboardButton",
  component: CopyToClipboardButton,
} satisfies Meta<typeof CopyToClipboardButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onClick: () => console.log("Copied!"),
  },
};

export const Small: Story = {
  args: {
    size: "small",
    onClick: () => console.log("Copied! (small)"),
  },
};

export const Large: Story = {
  args: {
    size: "large",
    onClick: () => console.log("Copied! (large)"),
  },
};

