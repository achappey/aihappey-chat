import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type TableStoryArgs = {
  bordered?: boolean;
  hover?: boolean;
  striped?: boolean;
  borderless?: boolean;
  size?: string;
};

const TableStory = (args: TableStoryArgs) => {
  const { Table } = useTheme() as unknown as Pick<AihUiTheme, "Table">;
  return (
    <Table {...args}>
      <thead>
        <tr>
          <th>Component</th>
          <th>Status</th>
          <th>Owner</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Button</td>
          <td>Ready</td>
          <td>Design System</td>
        </tr>
        <tr>
          <td>DataGrid</td>
          <td>Review</td>
          <td>Platform</td>
        </tr>
      </tbody>
    </Table>
  );
};

const meta = {
  title: "Table",
  component: TableStory,
  argTypes: {
    bordered: { control: { type: "boolean" } },
    hover: { control: { type: "boolean" } },
    striped: { control: { type: "boolean" } },
    borderless: { control: { type: "boolean" } },
    size: { control: { type: "select" }, options: ["small", "medium", "large"] },
  },
  args: {
    bordered: true,
    hover: true,
    striped: false,
    borderless: false,
    size: "medium",
  },
} satisfies Meta<typeof TableStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Striped: Story = {
  args: {
    striped: true,
  },
};

export const Borderless: Story = {
  args: {
    bordered: false,
    borderless: true,
  },
};

