import type { Meta, StoryObj } from "@storybook/react";
import type { FileUIPart } from "aihappey-ai";
import { AttachmentsDrawer } from "aihappey-components";

const meta = {
  title: "Drawers/AttachmentsDrawer",
  component: AttachmentsDrawer,
} satisfies Meta<typeof AttachmentsDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const attachments: FileUIPart[] = [
  {
    type: "file",
    url: "https://example.com/document.pdf",
    mediaType: "application/pdf",
  },
  {
    type: "file",
    url: "https://via.placeholder.com/640x360",
    mediaType: "image/png",
  },
];

export const Empty: Story = {
  args: {
    open: true,
    attachments: [],
    size: "small",
    onClose: () => console.log("Close"),
  },
};

export const WithAttachments: Story = {
  args: {
    open: true,
    attachments,
    size: "medium",
    onClose: () => console.log("Close"),
  },
};

