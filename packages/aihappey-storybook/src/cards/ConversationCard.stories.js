import React from "react";
import { ConversationCard } from "aihappey-components";

export default {
  title: "Cards/ConversationCard",
  component: ConversationCard,
};

const headerActions = React.createElement(
  "span",
  {
    style: {
      opacity: 0.7,
      fontSize: 12,
      whiteSpace: "nowrap",
    },
  },
  "2m ago"
);

const actions = React.createElement(
  "div",
  { style: { display: "flex", gap: 8 } },
  React.createElement(
    "button",
    { type: "button", onClick: () => {} },
    "Open"
  ),
  React.createElement(
    "button",
    { type: "button", onClick: () => {} },
    "Delete"
  )
);

export const Minimal = () =>
  React.createElement(ConversationCard, {
    title: "Conversation title",
  });

export const WithSubtitle = () =>
  React.createElement(ConversationCard, {
    title: "Conversation title",
    subtitle: "Workspace A",
  });

export const WithSnippet = () =>
  React.createElement(ConversationCard, {
    title: "Conversation title",
    snippet: "This is a short snippet of the last message...",
  });

export const WithSubtitleAndSnippet = () =>
  React.createElement(ConversationCard, {
    title: "Conversation title",
    subtitle: "Workspace A",
    snippet: "This is a short snippet of the last message...",
  });

export const WithHeaderActions = () =>
  React.createElement(ConversationCard, {
    title: "Conversation title",
    subtitle: "Workspace A",
    snippet: "This is a short snippet of the last message...",
    headerActions,
  });

export const WithActions = () =>
  React.createElement(ConversationCard, {
    title: "Conversation title",
    subtitle: "Workspace A",
    snippet:
      "A longer snippet to verify LimitedTextField truncation and Card actions layout.",
    actions,
  });

