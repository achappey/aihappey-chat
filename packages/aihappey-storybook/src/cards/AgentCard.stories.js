import React from "react";
import { AgentCard } from "aihappey-components";

export default {
  title: "Cards/AgentCard",
  component: AgentCard,
};

const exampleAgent = {
  id: "agent-1",
  name: "Research assistant",
  description:
    "An example agent card showing how agent metadata and actions are rendered.",
  model: {
    id: "gpt-4o-mini",
  },
};

export const Minimal = () =>
  React.createElement(AgentCard, {
    agent: exampleAgent,
  });

export const WithEdit = () =>
  React.createElement(AgentCard, {
    agent: exampleAgent,
    onEdit: () => {},
  });

export const WithDeleteMenu = () =>
  React.createElement(AgentCard, {
    agent: exampleAgent,
    onDelete: () => {},
    translations: { delete: "Delete" },
  });

export const WithEditAndDelete = () =>
  React.createElement(AgentCard, {
    agent: exampleAgent,
    onEdit: () => {},
    onDelete: () => {},
    translations: { delete: "Delete" },
  });