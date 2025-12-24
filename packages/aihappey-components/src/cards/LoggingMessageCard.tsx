

import React from "react";
import type { LoggingMessageNotificationParams } from "@modelcontextprotocol/sdk/types";
import { useTheme } from "../theme/ThemeContext";

export interface LoggingMessageCardProps {
  notif: LoggingMessageNotificationParams
  translations?: any
  onRenderMarkdown: (text: string) => React.ReactNode
}

export const LoggingMessageCard: React.FC<
  LoggingMessageCardProps
> = ({ notif, translations, onRenderMarkdown }) => {
  const { Card } = useTheme();
  const message = String(notif.data || "");
  return (
    <Card title={translations?.[notif.level] ?? notif.level}>
      {onRenderMarkdown(message)}
    </Card>
  );
};
