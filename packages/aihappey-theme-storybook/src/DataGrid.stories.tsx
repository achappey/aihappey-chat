import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type Row = { id: number; name: string; role: string; status: string };

type DataGridStoryArgs = {
  selectionMode?: "single" | "multiselect" | "none";
};

const rows: Row[] = [
  { id: 1, name: "Alice", role: "Admin", status: "Active" },
  { id: 2, name: "Bob", role: "User", status: "Invited" },
  { id: 3, name: "Charlie", role: "Guest", status: "Disabled" },
];

const DataGridStory = (args: DataGridStoryArgs) => {
  const { DataGrid } = useTheme() as unknown as Pick<AihUiTheme, "DataGrid">;
  return (
    <DataGrid<Row>
      {...args}
      columns={[
        { key: "id", header: "ID", render: (item) => item.id, width: 80 },
        { key: "name", header: "Name", render: (item) => item.name },
        { key: "role", header: "Role", render: (item) => item.role },
        { key: "status", header: "Status", render: (item) => item.status },
      ]}
      data={rows}
      rowKey={(item) => item.id}
    />
  );
};

const meta = {
  title: "DataGrid",
  component: DataGridStory,
  argTypes: {
    selectionMode: { control: { type: "select" }, options: ["none", "single", "multiselect"] },
  },
  args: {
    selectionMode: "none",
  },
} satisfies Meta<typeof DataGridStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleSelection: Story = {
  args: {
    selectionMode: "single",
  },
};

export const MultiSelection: Story = {
  args: {
    selectionMode: "multiselect",
  },
};

