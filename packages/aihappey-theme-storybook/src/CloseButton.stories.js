import React from "react";
import { useTheme } from "aihappey-components";

const CloseButtonView = (props) => {
  const { CloseButton } = useTheme();
  return React.createElement(CloseButton, props);
};

export default {
  title: "CloseButton",
  component: CloseButtonView,
};

export const Default = {
  render: () => React.createElement(CloseButtonView, {
    onClick: () => alert("Closed"),
  })
};
