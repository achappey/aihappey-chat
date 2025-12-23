import React from "react";
import { useTheme } from "aihappey-components";

const ToolbarView = (props) => {
  const { Toolbar, ToolbarButton, ToolbarDivider } = useTheme();
  return React.createElement(Toolbar, props,
    React.createElement(ToolbarButton, { onClick: () => alert("Btn 1") }, "Btn 1"),
    React.createElement(ToolbarDivider, {}),
    React.createElement(ToolbarButton, { onClick: () => alert("Btn 2") }, "Btn 2")
  );
};

export default {
  title: "Toolbar",
  component: ToolbarView,
};

export const Default = {
  render: () => React.createElement(ToolbarView, {
      size: "medium"
  })
};
