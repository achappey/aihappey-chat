import React from "react";
import { ReasoningCard } from "aihappey-components";

export default {
  title: "Cards/ReasoningCard",
  component: ReasoningCard,
};

const block = {
  type: "reasoning",
  text: "This is a detailed reasoning process explaining the steps taken to arrive at the answer.\n\n1. Step one\n2. Step two",
};

export const Default = () =>
  React.createElement(ReasoningCard, {
    block: block,
  });

export const WithMarkdown = () =>
  React.createElement(ReasoningCard, {
    block: block,
    renderText: (text) => React.createElement("pre", null, text),
  });
