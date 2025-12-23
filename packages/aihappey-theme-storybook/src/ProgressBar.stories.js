import React from "react";
import { useTheme } from "aihappey-components";

const ProgressBarView = (props) => {
  const { ProgressBar } = useTheme();
  return React.createElement(ProgressBar, props);
};

export default {
  title: "ProgressBar",
  component: ProgressBarView,
};

export const Default = {
  render: () => React.createElement(ProgressBarView, {
    value: 60,
    label: "60%"
  })
};
