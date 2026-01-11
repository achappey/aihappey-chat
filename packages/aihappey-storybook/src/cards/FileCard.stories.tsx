import type { Meta, StoryObj } from "@storybook/react";
import { FileCard } from "aihappey-components";
import type { ComponentProps } from "react";

const meta = {
  title: "Cards/FileCard",
  component: FileCard,
} satisfies Meta<typeof FileCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseFile: ComponentProps<typeof FileCard>["file"] = {
  id: "file-1",
  name: "example.txt",
  createdAt: new Date("2026-01-01T12:00:00.000Z").getTime(),
  data: new Blob(["Hello from FileCard"], { type: "text/plain" }),
};

export const Default: Story = {
  args: {
    file: baseFile,
  },
};

export const WithDelete: Story = {
  args: {
    file: baseFile,
    onDelete: () => console.log("Delete clicked", baseFile.id),
  },
};

export const WithDownload: Story = {
  args: {
    file: baseFile,
    onDownload: () => console.log("Download clicked", baseFile.id),
  },
};

export const WithDeleteAndDownload: Story = {
  args: {
    file: baseFile,
    onDelete: () => console.log("Delete clicked", baseFile.id),
    onDownload: () => console.log("Download clicked", baseFile.id),
  },
};

export const LargeBinary: Story = {
  args: {
    file: {
      ...baseFile,
      name: "big.bin",
      data: new Blob([new Uint8Array(1024 * 256)], {
        type: "application/octet-stream",
      }),
    },
    onDownload: () => console.log("Download clicked", "big.bin"),
  },
};

