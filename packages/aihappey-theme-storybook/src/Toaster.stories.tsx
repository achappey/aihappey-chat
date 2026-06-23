import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type ToasterStoryArgs = {
  position?: string;
};

const ToasterStory = (args: ToasterStoryArgs) => {
  const { Toaster } = useTheme() as unknown as Pick<AihUiTheme, "Toaster">;
  return (
    <Toaster
      {...args}
      toasts={[
        { id: "1", variant: "info", message: "Toast 1", show: true },
        { id: "2", variant: "success", message: "Toast 2", show: true },
        { id: "3", variant: "error", message: "Toast 3", show: true },
      ]}
    />
  );
};

const meta = {
  title: "Toaster",
  component: ToasterStory,
  argTypes: {
    position: { control: { type: "select" }, options: ["top-start", "top-end", "bottom-start", "bottom-end"] },
  },
  args: {
    position: "top-end",
  },
} satisfies Meta<typeof ToasterStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const BottomEnd: Story = {
  args: {
    position: "bottom-end",
  },
};

