import type { Meta, StoryObj } from "@storybook/react";
import { ConversationCard } from "aihappey-components";

const meta = {
  title: "Cards/ConversationCard",
  component: ConversationCard,
} satisfies Meta<typeof ConversationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const headerActions = (
  <span
    style={{
      opacity: 0.7,
      fontSize: 12,
      whiteSpace: "nowrap",
    }}
  >
    2m ago
  </span>
);

const actions = (
  <div style={{ display: "flex", gap: 8 }}>
    <button type="button" onClick={() => {}}>
      Open
    </button>
    <button type="button" onClick={() => {}}>
      Delete
    </button>
  </div>
);

export const Minimal: Story = {
  args: {
    title: "Conversation title",
  },
};

export const WithSubtitle: Story = {
  args: {
    title: "Conversation title",
    subtitle: "Workspace A",
  },
};

export const WithSnippet: Story = {
  args: {
    title: "Conversation title",
    snippet: "This is a short snippet of the last message...",
  },
};

export const WithSubtitleAndSnippet: Story = {
  args: {
    title: "Conversation title",
    subtitle: "Workspace A",
    snippet: "This is a short snippet of the last message...",
  },
};

export const WithHeaderActions: Story = {
  args: {
    title: "Conversation title",
    subtitle: "Workspace A",
    snippet: "This is a short snippet of the last message...",
    headerActions,
  },
};

export const WithActions: Story = {
  args: {
    title: "Conversation title",
    subtitle: "Workspace A",
    snippet:
      "A longer snippet to verify LimitedTextField truncation and Card actions layout.",
    actions,
  },
};

