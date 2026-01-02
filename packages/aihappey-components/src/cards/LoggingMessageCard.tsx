

import React from "react";
import type { LoggingMessageNotificationParams } from "@modelcontextprotocol/sdk/types";
import { useTheme } from "../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export interface LoggingMessageCardProps {
  notif: LoggingMessageNotificationParams
  onRenderMarkdown: (text: string) => React.ReactNode
}

export const LoggingMessageCard: React.FC<
  LoggingMessageCardProps
> = ({ notif, onRenderMarkdown }) => {
  const { Card } = useTheme();
  const { t } = useTranslation();

  const message = String(notif.data || "");
  return (
    <Card title={t(`logLevels.${notif.level}`)}>
      {onRenderMarkdown(message)}
    </Card>
  );
};
