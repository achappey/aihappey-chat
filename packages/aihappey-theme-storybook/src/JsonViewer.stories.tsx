import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type JsonViewerThemeProps = Parameters<AihUiTheme["JsonViewer"]>[0];

const JsonViewerStory = (args: JsonViewerThemeProps) => {
  const { JsonViewer } = useTheme() as unknown as Pick<AihUiTheme, "JsonViewer">;
  return <JsonViewer {...args} />;
};

const meta = {
  title: "JsonViewer",
  component: JsonViewerStory,
  argTypes: {
    value: { control: "object" },
    title: { control: { type: "text" } },
  },
  args: {
    title: "Sample JSON",
    value: { key: "value", number: 123, nested: { a: 1 } },
  },
} satisfies Meta<typeof JsonViewerStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LargeObject: Story = {
  args: {
    title: "Larger JSON",
    value: {
      id: "abc-123",
      flags: { enabled: true, beta: false },
      tags: ["one", "two", "three"],
      nested: {
        a: 1,
        b: 2,
        c: { deep: { ok: true } },
      },
    },
  },
};

