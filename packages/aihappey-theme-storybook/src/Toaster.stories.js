import React from "react";
import { useTheme } from "aihappey-components";

const ToasterView = (props) => {
  const { Toaster } = useTheme();
  return React.createElement(Toaster, props);
};

export default {
  title: "Toaster",
  component: ToasterView,
};

export const Default = {
  render: () => React.createElement(ToasterView, {
    toasts: [
        { id: "1", variant: "info", message: "Toast 1", show: true },
        { id: "2", variant: "success", message: "Toast 2", show: true }
    ],
    position: "top-end"
  })
};
