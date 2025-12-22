import React, { Children } from "react";
import { useTheme } from "aihappey-components";

const ButtonView = (props) => {
  const { Button } = useTheme();
  return React.createElement(Button, {
    ...props
  })
};

export default {
  title: "Button",
  component: ButtonView,
};

export const Small = {
  render: () => React.createElement(ButtonView, {
    size: "small",
  }, "Click me")
};