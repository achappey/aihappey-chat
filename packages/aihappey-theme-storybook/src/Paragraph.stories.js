import React from "react";
import { useTheme } from "aihappey-components";

const ParagraphView = (props) => {
  const { Paragraph } = useTheme();
  return React.createElement(Paragraph, props);
};

export default {
  title: "Paragraph",
  component: ParagraphView,
};

export const Default = {
  render: () => React.createElement(ParagraphView, {}, "This is a paragraph of text.")
};
