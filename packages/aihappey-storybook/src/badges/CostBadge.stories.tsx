import type { Meta, StoryObj } from "@storybook/react";
import { CostBadge } from "aihappey-components";

const meta: Meta<typeof CostBadge> = {
  title: "Badges/CostBadge",
  component: CostBadge,
};

export default meta;
type Story = StoryObj<typeof CostBadge>;

export const Undefined: Story = {
  render: () => <CostBadge />,
};

export const Zero: Story = {
  render: () => <CostBadge cost={0} />,
};

export const Decimal: Story = {
  render: () => <CostBadge cost={0.0123} />,
};

