import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type TextAreaStoryArgs = {
  value: string;
  label?: string;
  placeholder?: string;
  hint?: string;
  rows?: number;
  readOnly?: boolean;
  required?: boolean;
};

const TextAreaStory = (args: TextAreaStoryArgs) => {
  const { TextArea } = useTheme() as unknown as Pick<AihUiTheme, "TextArea">;
  const [value, setValue] = useState(args.value);

  useEffect(() => {
    setValue(args.value);
  }, [args.value]);

  return <>{TextArea({ ...args, value, onChange: setValue })}</>;
};

const meta = {
  title: "TextArea",
  component: TextAreaStory,
  argTypes: {
    value: { control: { type: "text" } },
    label: { control: { type: "text" } },
    placeholder: { control: { type: "text" } },
    hint: { control: { type: "text" } },
    rows: { control: { type: "number", min: 1, max: 12 } },
    readOnly: { control: { type: "boolean" } },
    required: { control: { type: "boolean" } },
  },
  args: {
    value: "",
    label: "Comments",
    placeholder: "Add a comment...",
    hint: "Use this to verify multiline input styling.",
    rows: 4,
    readOnly: false,
  },
} satisfies Meta<typeof TextAreaStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ReadOnly: Story = {
  args: {
    value: "This text area is read only.",
    readOnly: true,
  },
};

