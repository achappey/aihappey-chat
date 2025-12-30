import type { Meta, StoryObj } from "@storybook/react";
import { LoggingMessageCard } from "aihappey-components";

type LoggingMessageNotificationParamsLike = {
  level: string;
  data?: unknown;
};

const meta = {
  title: "Cards/LoggingMessageCard",
  component: LoggingMessageCard,
} satisfies Meta<typeof LoggingMessageCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const renderMarkdown = (text: string) => (
  <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{text}</pre>
);

const infoNotif =
  ({
    level: "info",
    data: "This is an informational log message.",
  } as LoggingMessageNotificationParamsLike);

const warnNotif =
  ({
    level: "warning",
    data: "This is a warning message with a little more detail.",
  } as LoggingMessageNotificationParamsLike);

const errorNotif =
  ({
    level: "error",
    data: "# Something went wrong\n\nThis simulates markdown-ish content (rendered by the provided callback).\n\n- item 1\n- item 2\n\n`inline code`",
  } as LoggingMessageNotificationParamsLike);

export const Info: Story = {
  args: {
    notif: infoNotif,
    onRenderMarkdown: renderMarkdown,
  },
};

export const WarnTranslated: Story = {
  args: {
    notif: warnNotif,
    translations: {
      warning: "Warning",
      info: "Info",
      error: "Error",
    },
    onRenderMarkdown: renderMarkdown,
  },
};

export const ErrorLongMarkdown: Story = {
  args: {
    notif: errorNotif,
    translations: {
      error: "Error",
    },
    onRenderMarkdown: renderMarkdown,
  },
};

