import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type ToastStoryArgs = {
  variant: "info" | "success" | "error";
  message: string;
  show: boolean;
  autohide?: number;
};

const ToastStory = (args: ToastStoryArgs) => {
  const { Toast } = useTheme() as unknown as Pick<AihUiTheme, "Toast">;
  const [show, setShow] = useState(args.show);

  useEffect(() => {
    setShow(args.show);
  }, [args.show]);

  return <Toast id="toast1" {...args} show={show} onClose={() => setShow(false)} />;
};

const meta = {
  title: "Toast",
  component: ToastStory,
  argTypes: {
    variant: { control: { type: "select" }, options: ["info", "success", "error"] },
    message: { control: { type: "text" } },
    show: { control: { type: "boolean" } },
    autohide: { control: { type: "number" } },
  },
  args: {
    variant: "info",
    message: "This is a toast message",
    show: true,
  },
} satisfies Meta<typeof ToastStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Success: Story = {
  args: {
    variant: "success",
    message: "The operation completed successfully.",
  },
};

export const Error: Story = {
  args: {
    variant: "error",
    message: "Something went wrong.",
  },
};

