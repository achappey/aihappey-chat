import type { Meta, StoryObj } from "@storybook/react";
import { AiWarningBadge } from "aihappey-components";

const meta: Meta<typeof AiWarningBadge> = {
  title: "Badges/AiWarningBadge",
  component: AiWarningBadge,
};

export default meta;
type Story = StoryObj<typeof AiWarningBadge>;

export const Default: Story = {
  render: () => <AiWarningBadge />,
};

export const Small: Story = {
  render: () => <AiWarningBadge size="small" />,
};

export const Large: Story = {
  render: () => <AiWarningBadge size="large" />,
};
