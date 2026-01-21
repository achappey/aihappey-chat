import type { Meta, StoryObj } from "@storybook/react";
import type { FileUIPart } from "aihappey-ai";
import { FileAttachmentCard } from "aihappey-components";

const meta = {
  title: "Cards/FileAttachmentCard",
  component: FileAttachmentCard,
} satisfies Meta<typeof FileAttachmentCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const pdfFile: FileUIPart = {
  type: "file",
  url: "https://example.com/document.pdf",
  mediaType: "application/pdf",
};

const imageFile: FileUIPart = {
  type: "file",
  url: "https://via.placeholder.com/150",
  mediaType: "image/png",
};

const base64File: FileUIPart = {
  type: "file",
  // Small 1x1 transparent PNG
  url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  mediaType: "image/png",
};

export const Pdf: Story = {
  args: {
    file: pdfFile,
    onAddToFiles: async (file) => {
      // Storybook stub: just log so the action is visible in devtools.
      console.log("onAddToFiles", file);
    },
  },
};

export const Image: Story = {
  args: {
    file: imageFile,
    onAddToFiles: async (file) => {
      console.log("onAddToFiles", file);
    },
  },
};

export const Base64Image: Story = {
  args: {
    file: base64File,
    onAddToFiles: async (file) => {
      console.log("onAddToFiles", file);
    },
  },
};

