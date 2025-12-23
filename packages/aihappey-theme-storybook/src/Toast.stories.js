import React from "react";
import { useTheme } from "aihappey-components";

const ToastView = (props) => {
  const { Toast } = useTheme();
  return React.createElement(Toast, props);
};

export default {
  title: "Toast",
  component: ToastView,
};

export const Default = {
  render: () => React.createElement(ToastView, {
    id: "toast1",
    variant: "info",
    message: "This is a toast message",
    show: true,
    onClose: () => alert("Close")
  })
};
