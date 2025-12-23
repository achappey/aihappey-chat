import React from "react";
import { ContentCard } from "aihappey-components";

export default {
  title: "Cards/ContentCard",
  component: ContentCard,
};

const textContent = {
  type: "text",
  text: "Hello, this is a text message.",
};

const reasoningContent = {
  type: "reasoning",
  text: "This is the reasoning process...",
};

const toolInvocationContent = {
  type: "tool-call",
  toolCallId: "call_1",
  name: "get_weather",
  args: { location: "Amsterdam" },
  state: "output-available",
  output: { temperature: 20 },
};

export const Text = () =>
  React.createElement(ContentCard, {
    content: textContent,
    onRenderMarkdown: (text) => React.createElement("div", null, text),
  });

export const Reasoning = () =>
  React.createElement(ContentCard, {
    content: reasoningContent,
    onRenderMarkdown: (text) => React.createElement("div", null, text),
  });

export const ToolInvocation = () =>
  React.createElement(ContentCard, {
    content: toolInvocationContent,
    onRenderMarkdown: (text) => React.createElement("div", null, text),
    onShowToolCallResult: (toolCall) => console.log("Show tool call", toolCall),
  });
