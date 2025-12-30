import React, { useEffect, useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { FileTags } from "aihappey-components";

const makeFiles = (): File[] => [
  new File(["Hello world"], "hello.txt", { type: "text/plain" }),
  new File([JSON.stringify({ ok: true }, null, 2)], "payload.json", { type: "application/json" }),
  new File(["binary"], "image.png", { type: "image/png" }),
];

// stabiele refs (handig voor controls / rerenders)
const FILES_SINGLE = [makeFiles()[0]];
const FILES_MANY = makeFiles();

const meta = {
  title: "Fields/FileTags",
  component: FileTags,
  args: {
    icon: "attachment",
    size: "small",
  },
  argTypes: {
    size: { control: "select", options: ["extra-small", "small", "medium"] },
    icon: { control: "text" },

    // deze wil je niet via controls bewerken (File objects / function)
    files: { control: false },
    removeFile: { control: false },
  },
} satisfies Meta<typeof FileTags>;

export default meta;
type Story = StoryObj<typeof meta>;

const Controlled: React.FC<React.ComponentProps<typeof FileTags>> = (args) => {
  const initialFiles = useMemo(() => args.files, [args.files]);
  const [files, setFiles] = useState<File[]>(initialFiles);

  // reset als story args.files wisselt (bijv. andere story selected)
  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  const controlledRemove =
    args.removeFile != null
      ? async (name: string) => {
          // call original handler (optioneel)
          await args.removeFile?.(name);
          // update local state
          setFiles((prev) => prev.filter((f) => f.name !== name));
        }
      : undefined;

  return (
    <div style={{ maxWidth: 480 }}>
      <FileTags {...args} files={files} removeFile={controlledRemove} />
    </div>
  );
};

export const SingleFile: Story = {
  args: {
    files: FILES_SINGLE,
  },
  render: (args) => <Controlled {...args} />,
};

export const ManyFiles: Story = {
  args: {
    files: FILES_MANY,
  },
  render: (args) => <Controlled {...args} />,
};

export const CustomSizeAndIcon: Story = {
  args: {
    files: FILES_MANY,
    size: "medium",
    icon: "attachment",
  },
  render: (args) => <Controlled {...args} />,
};

export const Removable: Story = {
  args: {
    files: FILES_MANY,
    size: "small",
    icon: "attachment",
    // no-op is genoeg; Controlled doet de echte state update
    removeFile: async () => {},
  },
  render: (args) => <Controlled {...args} />,
};
