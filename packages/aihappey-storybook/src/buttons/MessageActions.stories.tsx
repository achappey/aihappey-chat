import type { Meta, StoryObj } from "@storybook/react";
import type { ChatMessage } from "aihappey-types";
import type {
  FileUIPart,
  SourceUrlUIPart,
  TextUIPart,
  UIMessagePart,
} from "aihappey-ai";
import { MessageActions } from "aihappey-components";

const meta = {
  title: "Buttons/MessageActions",
  component: MessageActions,
} satisfies Meta<typeof MessageActions>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseAssistantMsg: ChatMessage = {
  id: "msg-1",
  role: "assistant",
  createdAt: new Date().toISOString(),
  content: [
    {
      type: "text",
      text: "Here is an assistant message with actions.",
    } as TextUIPart,
  ],
  totalTokens: 256,
  temperature: 0.7,
};

const attachments: FileUIPart[] = [
  {
    type: "file",
    url: "https://example.com/document.pdf",
    mediaType: "application/pdf",
  },
  {
    type: "file",
    url: "https://via.placeholder.com/150",
    mediaType: "image/png",
  },
];

const sources: SourceUrlUIPart[] = [
  {
    type: "source-url",
    url: "https://example.com",
    sourceId: "https://example.com",
    title: "Example Source",
  },
];

const activityContent: UIMessagePart<any, any>[] = [
  {
    type: "text",
    text: "Some activity content",
  },
];

export const AssistantBasic: Story = {
  args: {
    msg: baseAssistantMsg,
    page: 0,
    max: 0,
    size: "small",
    onCopyMessage: async () => console.log("Copy message"),
    onSetPage: (next) => console.log("Set page", next),
  },
};

export const WithAttachmentsAndSources: Story = {
  args: {
    msg: {
      ...baseAssistantMsg,
      attachments,
      sources,
    },
    page: 0,
    max: 0,
    onCopyMessage: async () => console.log("Copy message"),
    onShowAttachments: (files) => console.log("Attachments", files),
    onShowSources: (nextSources) => console.log("Sources", nextSources),
    onSetPage: (next) => console.log("Set page", next),
  },
};

export const Pagination: Story = {
  args: {
    msg: baseAssistantMsg,
    page: 1,
    max: 3,
    onSetPage: (next) => console.log("Set page", next),
  },
};

export const ActivityButton: Story = {
  args: {
    msg: {
      ...baseAssistantMsg,
      messageIcon: "cardList",
      messageLabel: "Activity",
      content: activityContent as any,
    },
    page: 0,
    max: 0,
    onShowActivity: (content) => console.log("Show activity", content),
    onSetPage: (next) => console.log("Set page", next),
  },
};

