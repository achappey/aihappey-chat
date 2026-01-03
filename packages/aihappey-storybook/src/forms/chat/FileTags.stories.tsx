import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { FileTags } from "aihappey-components";

const createFiles = () => [
  new File(["hello"], "example.txt"),
  new File(["world"], "notes.md"),
];

const meta: Meta<typeof FileTags> = {
  title: "Forms/Chat/FileTags",
  component: FileTags,
};

export default meta;

type Story = StoryObj<typeof FileTags>;

export const Default: Story = {
  render: () => {
    const [files, setFiles] = useState<File[]>(createFiles());

    const removeFile = (name: string) => {
      setFiles((prev) => prev.filter((f) => f.name !== name));
    };

    return (
      <FileTags
        files={files}
        removeFile={removeFile}
      />
    );
  },
};

export const Static: Story = {
  render: () => (
    <FileTags
      files={createFiles()}
    />
  ),
};

export const ExtraSmall: Story = {
  render: () => (
    <FileTags
      size="extra-small"
      files={createFiles()}
    />
  ),
};

export const Small: Story = {
  render: () => (
    <FileTags
      size="small"
      files={createFiles()}
    />
  ),
};

export const Medium: Story = {
  render: () => (
    <FileTags
      size="medium"
      files={createFiles()}
    />
  ),
};
