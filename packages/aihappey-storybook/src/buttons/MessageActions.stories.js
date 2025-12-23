import React from "react";
import { MessageActions } from "aihappey-components";

export default {
  title: "Buttons/MessageActions",
  component: MessageActions,
};

const userMessage = {
  id: "msg-1",
  role: "user",
  content: [{ type: "text", text: "Hello" }],
};

const assistantMessage = {
  id: "msg-2",
  role: "assistant",
  content: [{ type: "text", text: "Hi there!" }],
  totalTokens: 150,
  temperature: 0.7,
  attachments: [],
  sources: [],
};

const complexMessage = {
  ...assistantMessage,
  attachments: [{ type: "file", url: "http://example.com/file.pdf" }],
  sources: [{ type: "url", url: "http://example.com" }],
};

export const UserMessage = () =>
  React.createElement(MessageActions, {
    msg: userMessage,
    page: 0,
    max: 0,
    onCopyMessage: () => Promise.resolve(),
    onSetPage: () => {},
  });

export const AssistantMessage = () =>
  React.createElement(MessageActions, {
    msg: assistantMessage,
    page: 0,
    max: 0,
    onCopyMessage: () => Promise.resolve(),
    onSetPage: () => {},
  });

export const WithPagination = () =>
  React.createElement(MessageActions, {
    msg: assistantMessage,
    page: 1,
    max: 3,
    onCopyMessage: () => Promise.resolve(),
    onSetPage: (page) => console.log("Set page", page),
  });

export const WithExtras = () =>
  React.createElement(MessageActions, {
    msg: complexMessage,
    page: 0,
    max: 0,
    onCopyMessage: () => Promise.resolve(),
    onShowAttachments: (files) => console.log("Attachments", files),
    onShowSources: (sources) => console.log("Sources", sources),
    onShowActivity: (content) => console.log("Activity", content),
    onSetPage: () => {},
  });
