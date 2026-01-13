import type { Meta, StoryObj } from "@storybook/react";
import { ExperimentalBadge } from "aihappey-components";

const meta: Meta<typeof ExperimentalBadge> = {
  title: "Badges/ExperimentalBadge",
  component: ExperimentalBadge,
};

export default meta;
type Story = StoryObj<typeof ExperimentalBadge>;

export const Default: Story = {};

export const Small: Story = {
  args: {
    size: "small",
  },
};

export const Large: Story = {
  args: {
    size: "large",
  },
};

