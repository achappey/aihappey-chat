import React from "react";
import { useTheme } from "aihappey-components";

const JsonViewerView = (props) => {
  const { JsonViewer } = useTheme();
  return React.createElement(JsonViewer, props);
};

export default {
  title: "JsonViewer",
  component: JsonViewerView,
};

export const Default = {
  render: () => React.createElement(JsonViewerView, {
    title: "Sample JSON",
    value: { key: "value", number: 123, nested: { a: 1 } }
  })
};
