

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
  const translations = {
    [notif.level]: t(`logLevels.${notif.level}`)
  }
  return (
    <LoggingMessageCard notif={notif}
      translations={translations}
      onRenderMarkdown={(text) => <Markdown text={text} />}
    />
  );
};
