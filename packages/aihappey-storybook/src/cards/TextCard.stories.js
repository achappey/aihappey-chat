import React from "react";
import { TextCard } from "aihappey-components";

export default {
  title: "Cards/TextCard",
  component: TextCard,
};

const block = {
  type: "text",
  text: "This is a simple text card.",
};

export const Default = () =>
  React.createElement(TextCard, {
    block: block,
  });

export const WithMarkdown = () =>
  React.createElement(TextCard, {
    block: { type: "text", text: "# Heading\n\n- List item 1\n- List item 2" },
    renderText: (text) => React.createElement("pre", null, text),
  });
