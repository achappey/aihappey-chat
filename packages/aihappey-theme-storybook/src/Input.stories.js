import React from "react";
import { useTheme } from "aihappey-components";

const InputView = (props) => {
  const { Input } = useTheme();
  return React.createElement(Input, props);
};

export default {
  title: "Input",
  component: InputView,
};

export const Default = {
  render: () => React.createElement(InputView, {
    label: "Username",
    placeholder: "Enter username",
    hint: "Must be unique"
  })
};
