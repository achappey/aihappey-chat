

import React from "react";
import { LoggingMessageCard } from "aihappey-components";
import { Markdown } from "../../../../ui/markdown/Markdown";
import { useTranslation } from "react-i18next";
import type { LoggingMessageNotificationParams } from "@modelcontextprotocol/sdk/types";

export interface LoggingNotificationCardProps {
  notif: LoggingMessageNotificationParams
}

export const LoggingNotificationCard: React.FC<
  LoggingNotificationCardProps
> = ({ notif }) => {
  const { t } = useTranslation();

  return (
    <LoggingMessageCard notif={notif}
      onRenderMarkdown={(text) => <Markdown text={text} />}
    />
  );
};
