import React from "react";
import { useTheme } from "aihappey-components";

const TableView = (props) => {
  const { Table } = useTheme();
  return React.createElement(Table, props);
};

export default {
  title: "Table",
  component: TableView,
};

export const Default = {
  render: () => React.createElement(TableView, {
    bordered: true,
    hover: true,
  }, 
    React.createElement("thead", {}, 
        React.createElement("tr", {}, 
            React.createElement("th", {}, "Col 1"),
            React.createElement("th", {}, "Col 2")
        )
    ),
    React.createElement("tbody", {},
        React.createElement("tr", {}, 
            React.createElement("td", {}, "Data 1"),
            React.createElement("td", {}, "Data 2")
        )
    )
  )
};
