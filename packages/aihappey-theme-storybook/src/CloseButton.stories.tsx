import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type CloseButtonThemeProps = Parameters<AihUiTheme["CloseButton"]>[0];

const CloseButtonStory = (args: CloseButtonThemeProps) => {
  const { CloseButton } = useTheme() as unknown as Pick<AihUiTheme, "CloseButton">;
  return <CloseButton {...args} />;
};

const meta = {
  title: "CloseButton",
  component: CloseButtonStory,
  argTypes: {
    onClick: { control: false },
  },
  args: {
    "aria-label": "Close",
    onClick: () => console.log("CloseButton: clicked"),
  },
} satisfies Meta<typeof CloseButtonStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

