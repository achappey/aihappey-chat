import React from "react";
import { useTheme } from "aihappey-components";

const HeaderView = (props) => {
  const { Header } = useTheme();
  return React.createElement(Header, props);
};

export default {
  title: "Header",
  component: HeaderView,
};

export const Default = {
  render: () => React.createElement(HeaderView, {
    level: 1,
  }, "Heading Level 1")
};
