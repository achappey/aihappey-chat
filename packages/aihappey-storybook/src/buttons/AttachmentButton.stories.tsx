import type { Meta, StoryObj } from "@storybook/react";
import { AttachmentButton } from "aihappey-components";

const meta = {
  title: "Buttons/AttachmentButton",
  component: AttachmentButton,
} satisfies Meta<typeof AttachmentButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onFilesSelected: (files) => console.log("Files selected", files),
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    onFilesSelected: (files) => console.log("Files selected (disabled)", files),
  },
};

export const CustomIcon: Story = {
  args: {
    // use a known icon token from the app themes
    icon: "resources",
    onFilesSelected: (files) => console.log("Files selected (custom icon)", files),
  },
};


