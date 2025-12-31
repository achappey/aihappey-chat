import type { Meta, StoryObj } from "@storybook/react";
import { TemperatureBadge } from "aihappey-components";

const meta: Meta<typeof TemperatureBadge> = {
  title: "Badges/TemperatureBadge",
  component: TemperatureBadge,
};

export default meta;
type Story = StoryObj<typeof TemperatureBadge>;

export const Zero: Story = {
  render: () => <TemperatureBadge temperature={0} />,
};

export const Half: Story = {
  render: () => <TemperatureBadge temperature={0.5} />,
};

export const One: Story = {
  render: () => <TemperatureBadge temperature={1} />,
};
