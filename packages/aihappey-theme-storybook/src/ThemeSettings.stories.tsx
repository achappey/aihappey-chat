import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

const ThemeSettingsStory = () => {
  const { ThemeSettings } = useTheme() as unknown as Pick<AihUiTheme, "ThemeSettings">;
  return <ThemeSettings />;
};

const meta = {
  title: "ThemeSettings",
  component: ThemeSettingsStory,
} satisfies Meta<typeof ThemeSettingsStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

