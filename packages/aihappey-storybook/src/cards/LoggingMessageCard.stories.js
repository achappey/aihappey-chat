import React from "react";
import { LoggingMessageCard } from "aihappey-components";

export default {
  title: "Cards/LoggingMessageCard",
  component: LoggingMessageCard,
};

const renderMarkdown = (text) => React.createElement("div", null, text);

const infoNotif = {
  level: "info",
  data: "This is an informational log message.",
};

const warnNotif = {
  level: "warning",
  data: "This is a warning message with a little more detail.",
};

const errorNotif = {
  level: "error",
  data:
    "# Something went wrong\n\nThis simulates markdown-ish content (rendered by the provided callback).\n\n- item 1\n- item 2\n\n`inline code`",
};

export const Info = () =>
  React.createElement(LoggingMessageCard, {
    notif: infoNotif,
    onRenderMarkdown: renderMarkdown,
  });

export const WarnTranslated = () =>
  React.createElement(LoggingMessageCard, {
    notif: warnNotif,
    translations: {
      warning: "Warning",
      info: "Info",
      error: "Error",
    },
    onRenderMarkdown: renderMarkdown,
  });

export const ErrorLongMarkdown = () =>
  React.createElement(LoggingMessageCard, {
    notif: errorNotif,
    translations: {
      error: "Error",
    },
    onRenderMarkdown: renderMarkdown,
  });

