import React from "react";
import { useTheme } from "aihappey-components";

const SpinnerView = (props) => {
  const { Spinner } = useTheme();
  return React.createElement(Spinner, props);
};

export default {
  title: "Spinner",
  component: SpinnerView,
};

export const Default = {
  render: () => React.createElement(SpinnerView, {
    size: "medium",
    label: "Loading..."
  })
};
