import type { Meta, StoryObj } from "@storybook/react";
import { CapabilityIcon } from "aihappey-components";

const meta: Meta<typeof CapabilityIcon> = {
  title: "Images/CapabilityIcon",
  component: CapabilityIcon,
};

export default meta;
type Story = StoryObj<typeof CapabilityIcon>;

export const SingleIcon: Story = {
  render: () => (
    <CapabilityIcon
      icons={[
        { src: "https://via.placeholder.com/64", theme: "light" },
      ]}
    />
  ),
};

export const LightDarkList: Story = {
  render: () => (
    <CapabilityIcon
      icons={[
        { src: "https://via.placeholder.com/64?text=Light", theme: "light" },
        { src: "https://via.placeholder.com/64?text=Dark", theme: "dark" },
      ]}
    />
  ),
};
