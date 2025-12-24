import React from "react";
import { UIMessagePartCard } from "aihappey-components";

export default {
  title: "Cards/UIMessagePartCard",
  component: UIMessagePartCard,
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
  React.createElement(UIMessagePartCard, {
    content: textContent,
    onRenderMarkdown: (text) => React.createElement("div", null, text),
  });

export const Reasoning = () =>
  React.createElement(UIMessagePartCard, {
    content: reasoningContent,
    onRenderMarkdown: (text) => React.createElement("div", null, text),
  });

export const ToolInvocation = () =>
  React.createElement(UIMessagePartCard, {
    content: toolInvocationContent,
    onRenderMarkdown: (text) => React.createElement("div", null, text),
    onShowToolCallResult: (toolCall) => console.log("Show tool call", toolCall),
  });
