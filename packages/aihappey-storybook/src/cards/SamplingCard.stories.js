import React from "react";
import { SamplingCard } from "aihappey-components";

export default {
  title: "Cards/SamplingCard",
  component: SamplingCard,
};

const minimalRequest = {
  method: "sampling/createMessage",
  params: {
    messages: [{ role: "user", content: [{ type: "text", text: "Hello" }] }],
    maxTokens: 32,
    modelPreferences: {},
  },
};

const requestWithHint = {
  ...minimalRequest,
  params: {
    ...minimalRequest.params,
    modelPreferences: { hints: [{ name: "Prefer fast models" }] },
  },
};

const result = {
  role: "assistant",
  content: [{ type: "text", text: "Hi!" }],
  model: "gpt-4o-mini",
};

export const MinimalRequest = () =>
  React.createElement(SamplingCard, {
    request: minimalRequest,
  });

export const WithHintDescription = () =>
  React.createElement(SamplingCard, {
    request: requestWithHint,
  });

export const WithResultProvided = () =>
  React.createElement(SamplingCard, {
    request: requestWithHint,
    result,
  });
