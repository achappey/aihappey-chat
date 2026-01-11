import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type AlertStoryArgs = {
  variant: string;
  title?: string;
  children: string;
  dismissible: boolean;
};

const AlertStory = (args: AlertStoryArgs) => {
  const { variant, title, children, dismissible } = args;
  const { Alert } = useTheme() as unknown as Pick<AihUiTheme, "Alert">;

  return (
    <Alert variant={variant} title={title} onDismiss={dismissible ? () => undefined : undefined}>
      {children}
    </Alert>
  );
};

const meta = {
  title: "Alert",
  component: AlertStory,
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["info", "success", "warning", "error"],
    },
    title: {
      control: { type: "text" },
    },
    children: {
      control: { type: "text" },
    },
    dismissible: {
      control: { type: "boolean" },
    },
  },
  args: {
    variant: "info",
    title: "Alert Title",
    children: "This is an alert message.",
    dismissible: false,
  },
} satisfies Meta<typeof AlertStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dismissible: Story = {
  args: {
    dismissible: true,
  },
};

