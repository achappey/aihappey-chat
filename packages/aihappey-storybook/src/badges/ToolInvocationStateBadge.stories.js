import React from "react";
import { ToolInvocationStateBadge } from "aihappey-components";

export default {
  title: "Badges/ToolInvocationStateBadge",
  component: ToolInvocationStateBadge,
};

export const InputAvailable = () =>
  React.createElement(ToolInvocationStateBadge, {
    state: "input-available",
  });

export const InputStreaming = () =>
  React.createElement(ToolInvocationStateBadge, {
    state: "input-streaming",
  });

export const OutputSuccess = () =>
  React.createElement(ToolInvocationStateBadge, {
    state: "output-available",
    output: { isError: false },
  });

export const OutputError = () =>
  React.createElement(ToolInvocationStateBadge, {
    state: "output-available",
    output: { isError: true },
  });

export const OutputStateError = () =>
  React.createElement(ToolInvocationStateBadge, {
    state: "output-error",
  });
