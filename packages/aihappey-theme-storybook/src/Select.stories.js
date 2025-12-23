import React, { useState } from "react";
import { useTheme } from "aihappey-components";

const SelectView = (props) => {
  const { Select } = useTheme();
  return React.createElement(Select, props);
};

export default {
  title: "Select",
  component: SelectView,
};

export const Default = {
  render: () => {
    // Assuming it behaves somewhat like a select
    return React.createElement(SelectView, {
        defaultValue: "1",
        placeholder: "Select an option",
        children: [
            React.createElement("option", { key: "1", value: "1" }, "Option 1"),
            React.createElement("option", { key: "2", value: "2" }, "Option 2")
        ]
    });
  }
};
