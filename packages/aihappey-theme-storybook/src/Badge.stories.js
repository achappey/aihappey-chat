import React from "react";
import { useTheme } from "aihappey-components";

const BadgeView = (props) => {
  const { Badge } = useTheme();
  return React.createElement(Badge, props);
};

export default {
  title: "Badge",
  component: BadgeView,
};

export const Default = {
  render: () => React.createElement(BadgeView, {
    appearance: "filled",
  }, "Badge")
};
