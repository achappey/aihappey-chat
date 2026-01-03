import type { Meta, StoryObj } from "@storybook/react";
import { ElicitationActionButtons } from "aihappey-components";

const meta = {
  title: "Buttons/ElicitationActionButtons",
  component: ElicitationActionButtons,
} satisfies Meta<typeof ElicitationActionButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Valid: Story = {
  args: {
    isValid: true,
    onAction: (action) => console.log("Action", action),
  },
};

export const Invalid: Story = {
  args: {
    isValid: false,
    onAction: (action) => console.log("Action", action),
  },
};

