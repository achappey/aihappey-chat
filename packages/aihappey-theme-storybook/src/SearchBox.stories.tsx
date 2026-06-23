import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type SearchBoxStoryArgs = {
  value: string;
  placeholder?: string;
  disabled?: boolean;
};

const SearchBoxStory = (args: SearchBoxStoryArgs) => {
  const { SearchBox } = useTheme() as unknown as Pick<AihUiTheme, "SearchBox">;
  const [value, setValue] = useState(args.value);

  useEffect(() => {
    setValue(args.value);
  }, [args.value]);

  return <SearchBox {...args} value={value} onChange={setValue} />;
};

const meta = {
  title: "SearchBox",
  component: SearchBoxStory,
  argTypes: {
    value: { control: { type: "text" } },
    placeholder: { control: { type: "text" } },
    disabled: { control: { type: "boolean" } },
  },
  args: {
    value: "",
    placeholder: "Search...",
    disabled: false,
  },
} satisfies Meta<typeof SearchBoxStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    value: "theme",
  },
};

export const Disabled: Story = {
  args: {
    value: "Disabled search",
    disabled: true,
  },
};

