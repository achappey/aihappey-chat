import React from "react";
import { ContentList } from "aihappey-components";

export default {
  title: "Lists/ContentList",
  component: ContentList,
};

const textContent = {
  type: "text",
  text: "Hello, this is a text message.",
};

const reasoningContent = {
  type: "reasoning",
  text: "This is the reasoning process that explains how we arrived at the conclusion.",
};

const toolInvocationContent = {
  type: "tool-call",
  toolCallId: "call_1",
  name: "get_weather",
  args: { location: "Amsterdam" },
  state: "output-available",
  output: { temperature: 20 },
};

const mixedContent = [
  textContent,
  reasoningContent,
  toolInvocationContent,
  { type: "text", text: "And here is some final text." }
];

const renderMarkdown = (text) => React.createElement("div", null, text);

export const TextOnly = () =>
  React.createElement(ContentList, {
    content: [textContent, { type: "text", text: "Another paragraph." }],
    onRenderMarkdown: renderMarkdown,
  });

export const Reasoning = () =>
  React.createElement(ContentList, {
    content: [reasoningContent],
    onRenderMarkdown: renderMarkdown,
  });

export const ToolInteraction = () =>
  React.createElement(ContentList, {
    content: [toolInvocationContent],
    onRenderMarkdown: renderMarkdown,
    onShowToolCallResult: (toolCall) => console.log("Show tool call", toolCall),
  });

export const MixedContent = () =>
  React.createElement(ContentList, {
    content: mixedContent,
    onRenderMarkdown: renderMarkdown,
    onShowToolCallResult: (toolCall) => console.log("Show tool call", toolCall),
  });
