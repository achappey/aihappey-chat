import React from "react";
import { useTheme } from "aihappey-components";

const DataGridView = (props) => {
  const { DataGrid } = useTheme();
  return React.createElement(DataGrid, props);
};

export default {
  title: "DataGrid",
  component: DataGridView,
};

export const Default = {
  render: () => React.createElement(DataGridView, {
    columns: [
      { key: "id", header: "ID", render: (item) => item.id },
      { key: "name", header: "Name", render: (item) => item.name },
      { key: "role", header: "Role", render: (item) => item.role }
    ],
    data: [
      { id: 1, name: "Alice", role: "Admin" },
      { id: 2, name: "Bob", role: "User" },
      { id: 3, name: "Charlie", role: "Guest" }
    ],
    rowKey: (item) => item.id
  })
};
