import React from "react";
import { useTheme } from "aihappey-components";

const AlertView = (props) => {
  const { Alert } = useTheme();
  return React.createElement(Alert, props);
};

export default {
  title: "Alert",
  component: AlertView,
};

export const Default = {
  render: () => React.createElement(AlertView, {
    variant: "info",
    title: "Alert Title"
  }, "This is an alert message.")
};
