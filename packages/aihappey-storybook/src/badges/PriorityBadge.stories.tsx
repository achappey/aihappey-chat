import type { Meta, StoryObj } from "@storybook/react";
import { PriorityBadge } from "aihappey-components";

const meta: Meta<typeof PriorityBadge> = {
  title: "Badges/PriorityBadge",
  component: PriorityBadge,
};

export default meta;
type Story = StoryObj<typeof PriorityBadge>;

export const Low: Story = {
  render: () => <PriorityBadge priority={1} />,
};

export const Medium: Story = {
  render: () => <PriorityBadge priority={5} />,
};

export const High: Story = {
  render: () => <PriorityBadge priority={10} />,
};
