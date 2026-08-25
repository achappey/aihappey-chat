import type { Meta, StoryObj } from "@storybook/react";
import { SizeBadge } from "aihappey-components";

const meta: Meta<typeof SizeBadge> = {
  title: "Badges/SizeBadge",
  component: SizeBadge,
};

export default meta;
type Story = StoryObj<typeof SizeBadge>;

export const Bytes: Story = {
  args: { bytes: 764 },
};

export const Kilobytes: Story = {
  args: { bytes: 348.7 * 1024 },
};

export const Megabytes: Story = {
  args: { bytes: 1.8 * 1024 * 1024 },
};
