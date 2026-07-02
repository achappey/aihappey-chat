import type { Meta, StoryObj } from "@storybook/react";
import { MessageList } from "aihappey-components";
import type { ChatMessage } from "aihappey-types";
import type { ReasoningUIPart, TextUIPart } from "aihappey-ai";

const meta: Meta<typeof MessageList> = {
  title: "Lists/MessageList",
  component: MessageList,
};

export default meta;
type Story = StoryObj<typeof MessageList>;

const renderMarkdown = (text: string) => <div>{text}</div>;

const userMsg: ChatMessage = {
  id: "1",
  role: "user",
  createdAt: new Date().toISOString(),
  messageIcon: "customize",
  content: [
    {
      type: "text",
      text: "Hello, can you help me?",
    } as TextUIPart,
  ],
};

const assistantMsg: ChatMessage = {
  id: "2",
  role: "assistant",
  createdAt: new Date().toISOString(),
  providerKey: "openai",
  content: [
    {
      type: "text",
      text: "Sure, what do you need?",
    } as TextUIPart,
  ],
};

const providers = {
  openai: {
    name: "OpenAI",
    icons: [
      { src: "https://placehold.co/40x40?text=AI", theme: "light" },
    ],
  },
};

const multiPageMsg: ChatMessage = {
  id: "3",
  role: "assistant",
  createdAt: new Date().toISOString(),
  content: [
    {
      type: "reasoning",
      text: "First I need to think about the problem...",
    } as ReasoningUIPart,
    {
      type: "text",
      text: "Here is the answer based on my reasoning.",
    } as TextUIPart,
  ],
};

const richMsg: ChatMessage = {
  id: "4",
  role: "assistant",
  createdAt: new Date().toISOString(),
  content: [
    {
      type: "text",
      text: "I found this image for you.",
    } as TextUIPart,
  ],
  attachments: [
    {
      type: "file",
      url: "http://example.com/doc.pdf",
      mediaType: "application/pdf",
      // name: "document.pdf",
    },
  ],
  sources: [
    {
      type: "source-url",
      url: "http://example.com",
      sourceId: "http://example.com",
      title: "Example Source",
    },
  ],
};

/**
 * CONVERSATION — user + assistant
 */
export const Conversation: Story = {
  render: () => (
    <MessageList
      messages={[userMsg, assistantMsg]}
      providers={providers}
      onRenderMarkdown={renderMarkdown}
      onCopyMessage={async () => { }}
    />
  ),
};

/**
 * PAGINATION — multi-block message
 */
export const Pagination: Story = {
  render: () => (
    <MessageList
      messages={[multiPageMsg]}
      onRenderMarkdown={renderMarkdown}
      onCopyMessage={async () => { }}
    />
  ),
};

/**
 * RICH CONTENT — attachments + sources
 */
export const RichContent: Story = {
  render: () => (
    <MessageList
      messages={[richMsg]}
      onRenderMarkdown={renderMarkdown}
      onCopyMessage={async () => { }}
      onShowAttachments={(files) =>
        console.log("Attachments", files)
      }
      onShowSources={(sources) =>
        console.log("Sources", sources)
      }
    />
  ),
};

/**
 * EMPTY — no messages
 */
export const Empty: Story = {
  render: () => (
    <MessageList
      messages={[]}
      onRenderMarkdown={renderMarkdown}
    />
  ),
};

export const StreamingAssistant: Story = {
  render: () => (
    <MessageList
      messages={[
        userMsg,
        {
          ...assistantMsg,
          id: "streaming-assistant",
          content: [
            {
              type: "text",
              text: "This assistant message demonstrates the same text-part shape used while playground streaming is progressively updating the UI.",
            } as TextUIPart,
          ],
        },
      ]}
      providers={providers}
      onRenderMarkdown={renderMarkdown}
      onCopyMessage={async () => { }}
    />
  ),
};
