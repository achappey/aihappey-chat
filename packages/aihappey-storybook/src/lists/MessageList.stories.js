import React from "react";
import { MessageList } from "aihappey-components";

export default {
  title: "Lists/MessageList",
  component: MessageList,
};

const renderMarkdown = (text) => React.createElement("div", null, text);

const userMsg = {
    id: "1",
    role: "user",
    createdAt: new Date().toISOString(),
    content: [{ type: "text", text: "Hello, can you help me?" }]
};

const assistantMsg = {
    id: "2",
    role: "assistant",
    createdAt: new Date().toISOString(),
    content: [{ type: "text", text: "Sure, what do you need?" }]
};

const multiPageMsg = {
    id: "3",
    role: "assistant",
    createdAt: new Date().toISOString(),
    content: [
        { type: "reasoning", text: "First I need to think about the problem..." },
        { type: "text", text: "Here is the answer based on my reasoning." }
    ]
};

const richMsg = {
    id: "4",
    role: "assistant",
    createdAt: new Date().toISOString(),
    content: [
        { type: "text", text: "I found this image for you." },
        { type: "file", url: "https://via.placeholder.com/150", mediaType: "image/png" }
    ],
    attachments: [{ type: "file", url: "http://example.com/doc.pdf", name: "document.pdf" }],
    sources: [{ type: "url", url: "http://example.com", title: "Example Source" }]
};

export const Conversation = () =>
  React.createElement(MessageList, {
    messages: [userMsg, assistantMsg],
    onRenderMarkdown: renderMarkdown,
    onCopyMessage: () => Promise.resolve(),
  });

export const Pagination = () =>
  React.createElement(MessageList, {
    messages: [multiPageMsg],
    onRenderMarkdown: renderMarkdown,
    onCopyMessage: () => Promise.resolve(),
  });

export const RichContent = () =>
  React.createElement(MessageList, {
    messages: [richMsg],
    onRenderMarkdown: renderMarkdown,
    onCopyMessage: () => Promise.resolve(),
    onShowAttachments: (files) => console.log("Attachments", files),
    onShowSources: (sources) => console.log("Sources", sources),
  });

export const Empty = () =>
  React.createElement(MessageList, {
    messages: [],
    onRenderMarkdown: renderMarkdown,
  });
