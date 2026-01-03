import type { Meta, StoryObj } from "@storybook/react";
import { TokenBadge } from "aihappey-components";

const meta: Meta<typeof TokenBadge> = {
  title: "Badges/TokenBadge",
  component: TokenBadge,
};

export default meta;
type Story = StoryObj<typeof TokenBadge>;

export const Undefined: Story = {
  render: () => <TokenBadge />,
};

export const Zero: Story = {
  render: () => <TokenBadge totalTokens={0} />,
};

export const SmallCount: Story = {
  render: () => <TokenBadge totalTokens={128} />,
};

export const LargeCount: Story = {
  render: () => <TokenBadge totalTokens={123456} />,
};

