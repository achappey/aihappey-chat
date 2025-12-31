import type { Meta, StoryObj } from "@storybook/react";
import { ToolDenyConfirmModal } from "aihappey-components";

const meta = {
  title: "Modals/ToolDenyConfirmModal",
  component: ToolDenyConfirmModal,
} satisfies Meta<typeof ToolDenyConfirmModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    size: "small",
    onConfirm: (reason) => console.log("Denied", { reason }),
    onCancel: () => console.log("Cancel"),
  },
};

