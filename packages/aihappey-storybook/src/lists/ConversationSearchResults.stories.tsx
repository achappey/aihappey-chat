import type { Meta, StoryObj } from "@storybook/react";
import {
  ConversationSearchResults,
  type ConversationSearchResultItem,
} from "aihappey-components";

const meta: Meta<typeof ConversationSearchResults> = {
  title: "Lists/ConversationSearchResults",
  component: ConversationSearchResults,
};

export default meta;
type Story = StoryObj<typeof ConversationSearchResults>;

const baseItems: ConversationSearchResultItem[] = [
  {
    conversationId: "c1",
    title: "Project kickoff",
    subtitle: "General",
    snippet: "Can you summarize the decisions we made?",
    lastMessageTimestamp: new Date(
      Date.now() - 2 * 60 * 1000
    ).toISOString(),
    conversationUrl: "https://example.com/conversations/c1",
  },
  {
    conversationId: "c2",
    title: "Bug triage",
    subtitle: "Engineering",
    snippet: "Repro steps: open the modal and search...",
    lastMessageTimestamp: new Date(
      Date.now() - 3 * 60 * 60 * 1000
    ).toISOString(),
    // no URL → open-in-new-tab disabled
  },
  {
    conversationId: "c3",
    title: "Architecture notes",
    snippet: "We should keep the client stateless and stream results.",
    // no timestamp → no headerActions
    conversationUrl: "https://example.com/conversations/c3",
  },
];

/**
 * EMPTY — default text
 */
export const EmptyDefault: Story = {
  render: () => (
    <ConversationSearchResults
      items={[]}
      onSelect={() => {}}
    />
  ),
};

/**
 * EMPTY — custom text
 */
export const EmptyCustomText: Story = {
  render: () => (
    <ConversationSearchResults
      items={[]}
      onSelect={() => {}}
      emptyText="No matching conversations"
    />
  ),
};

/**
 * WITH ITEMS — mixed capabilities
 */
export const WithItems: Story = {
  render: () => (
    <ConversationSearchResults
      items={baseItems}
      onSelect={(id) => console.log("Select", id)}
      onOpenInNewTab={(id) => console.log("Open in new tab", id)}
    />
  ),
};
