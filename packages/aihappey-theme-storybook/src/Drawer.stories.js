import React, { useState } from "react";
import { useTheme } from "aihappey-components";

const DrawerView = (props) => {
  const { Drawer, Button } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  return React.createElement(React.Fragment, {},
    React.createElement(Button, { onClick: () => setIsOpen(true) }, "Open Drawer"),
    React.createElement(Drawer, {
      ...props,
      open: isOpen,
      onClose: () => setIsOpen(false)
    }, props.children)
  );
};

export default {
  title: "Drawer",
  component: DrawerView,
};

export const Default = {
  render: () => React.createElement(DrawerView, {
    title: "Drawer Title",
    position: "end",
    size: "medium"
  }, "Drawer Content")
};
