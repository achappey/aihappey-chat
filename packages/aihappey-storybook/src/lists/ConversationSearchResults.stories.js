import React from "react";
import { ConversationSearchResults } from "aihappey-components";

export default {
  title: "Lists/ConversationSearchResults",
  component: ConversationSearchResults,
};

const baseItems = [
  {
    conversationId: "c1",
    title: "Project kickoff",
    subtitle: "General",
    snippet: "Can you summarize the decisions we made?",
    lastMessageTimestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    conversationUrl: "https://example.com/conversations/c1",
  },
  {
    conversationId: "c2",
    title: "Bug triage",
    subtitle: "Engineering",
    snippet: "Repro steps: open the modal and search...",
    lastMessageTimestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    // no URL => open-in-new-tab should be disabled
  },
  {
    conversationId: "c3",
    title: "Architecture notes",
    snippet: "We should keep the client stateless and stream results.",
    // no timestamp => headerActions should be absent
    conversationUrl: "https://example.com/conversations/c3",
  },
];

export const EmptyDefault = () =>
  React.createElement(ConversationSearchResults, {
    items: [],
    onSelect: () => {},
  });

export const EmptyCustomText = () =>
  React.createElement(ConversationSearchResults, {
    items: [],
    onSelect: () => {},
    emptyText: "No matching conversations",
  });

export const WithItems = () =>
  React.createElement(ConversationSearchResults, {
    items: baseItems,
    onSelect: (id) => console.log("Select", id),
    onOpenInNewTab: (id) => console.log("Open in new tab", id),
  });

