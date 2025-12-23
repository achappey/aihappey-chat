import React from "react";
import { ToolContent } from "aihappey-components";

export default {
  title: "Fields/ToolContent",
  component: ToolContent,
};

const simpleInvocation = {
  type: "tool-call",
  toolCallId: "call_1",
  input: { location: "Amsterdam" },
};

const complexInvocation = {
  type: "tool-call",
  toolCallId: "call_2",
  input: {
    query: "SELECT * FROM users",
    database: "production",
    options: {
      timeout: 5000,
    },
  },
};

const toolDefinition = {
  name: "get_weather",
  description: "Get weather for a location",
  inputSchema: {},
};

export const Simple = () =>
  React.createElement(ToolContent, {
    invocation: simpleInvocation,
  });

export const Complex = () =>
  React.createElement(ToolContent, {
    invocation: complexInvocation,
  });

export const WithToolDefinition = () =>
  React.createElement(ToolContent, {
    invocation: simpleInvocation,
    tool: toolDefinition,
  });
