import React from "react";
import { ToolInvocationCard } from "aihappey-components";

export default {
  title: "Cards/ToolInvocationCard",
  component: ToolInvocationCard,
};

const tool = {
  name: "demo-tool",
  title: "Demo Tool",
  icons: [{ src: "https://placehold.co/32x32?text=T", theme: "light" }],
};

const translations = {
  success: "Success",
  error: "Error",
  outputError: "Output error",
  inputStreaming: "Input streaming",
  inputAvailable: "Input available",
};

const baseInvocation = {
  type: "tool-demo-tool",
  input: { query: "hello", limit: 3 },
  toolCallId: "call-1",
};

export const InputAvailable = () =>
  React.createElement(ToolInvocationCard, {
    invocation: { ...baseInvocation, state: "input-available" },
    tool,
    translations,
  });

export const InputStreaming = () =>
  React.createElement(ToolInvocationCard, {
    invocation: { ...baseInvocation, state: "input-streaming" },
    tool,
    translations,
  });

export const OutputAvailableSuccess = () =>
  React.createElement(ToolInvocationCard, {
    invocation: {
      ...baseInvocation,
      state: "output-available",
      output: { isError: false, result: { ok: true, items: [1, 2, 3] } },
    },
    tool,
    translations,
    onShowOutput: () => {},
  });

export const OutputAvailableError = () =>
  React.createElement(ToolInvocationCard, {
    invocation: {
      ...baseInvocation,
      state: "output-available",
      output: { isError: true, message: "Something went wrong" },
    },
    tool,
    translations,
    onShowOutput: () => {},
  });

export const OutputError = () =>
  React.createElement(ToolInvocationCard, {
    invocation: { ...baseInvocation, state: "output-error" },
    tool,
    translations,
  });

export const WithoutToolUsesInvocationTypeForTitle = () =>
  React.createElement(ToolInvocationCard, {
    invocation: { ...baseInvocation, type: "tool-custom" },
    translations,
  });

export const WithExplainTool = () => {
  const getToolExplanation = async (invocation) =>
    `Explaining ${invocation.type}: This tool searches for relevant data.`;

  const renderToolExplanation = (text) =>
    React.createElement(
      "div",
      { style: { whiteSpace: "pre-wrap" } },
      text,
    );

  return React.createElement(ToolInvocationCard, {
    invocation: { ...baseInvocation, state: "input-available" },
    tool,
    translations,
    getToolExplanation,
    renderToolExplanation,
  });
};
