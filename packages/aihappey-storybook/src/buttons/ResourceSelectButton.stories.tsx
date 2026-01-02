import type { Meta, StoryObj } from "@storybook/react";
import { ResourceSelectButton } from "aihappey-components";

const meta = {
  title: "Buttons/ResourceSelectButton",
  component: ResourceSelectButton,
} satisfies Meta<typeof ResourceSelectButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onClick: () => console.log("Resource select clicked"),
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    onClick: () => console.log("Should not fire when disabled"),
  },
};


