import React from "react";
import { useTheme } from "aihappey-components";

const MenuView = (props) => {
  const { Menu, Button } = useTheme();
  return React.createElement(Menu, {
      ...props,
      trigger: props.trigger || React.createElement(Button, {}, "Menu Trigger")
  });
};

export default {
  title: "Menu",
  component: MenuView,
};

export const Default = {
  render: () => React.createElement(MenuView, {
    items: [
      { key: "1", label: "Item 1", onClick: () => alert("1") },
      { key: "2", label: "Item 2", onClick: () => alert("2") },
      { key: "3", label: "Delete", danger: true }
    ],
    align: "left"
  })
};
