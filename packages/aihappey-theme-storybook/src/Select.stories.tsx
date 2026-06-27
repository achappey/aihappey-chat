import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type SelectStoryArgs = {
  placeholder?: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
  initialValue?: string;
};

const SelectStory = ({ initialValue = "1", ...args }: SelectStoryArgs) => {
  const { Select } = useTheme() as unknown as Pick<AihUiTheme, "Select">;
  const [values, setValues] = useState([initialValue]);
  const [changeCount, setChangeCount] = useState(0);

  useEffect(() => {
    setValues([initialValue]);
    setChangeCount(0);
  }, [initialValue]);

  return (
    <div style={{ display: "grid", gap: 8, maxWidth: 320 }}>
      <Select
        {...args}
        values={values}
        valueTitle={`Selected: ${values.join(", ")}`}
        onChange={(value: string) => {
          setValues([value]);
          setChangeCount((count) => count + 1);
        }}
      >
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
      </Select>
      <small>Change calls: {changeCount}</small>
    </div>
  );
};

const meta = {
  title: "Select",
  component: SelectStory,
  argTypes: {
    placeholder: { control: { type: "text" } },
    label: { control: { type: "text" } },
    hint: { control: { type: "text" } },
    disabled: { control: { type: "boolean" } },
    initialValue: { control: { type: "select" }, options: ["1", "2", "3"] },
  },
  args: {
    placeholder: "Select an option",
    label: "Demo select",
    hint: "Toggle value and verify the current selection is visible",
    disabled: false,
    initialValue: "1",
  },
} satisfies Meta<typeof SelectStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

