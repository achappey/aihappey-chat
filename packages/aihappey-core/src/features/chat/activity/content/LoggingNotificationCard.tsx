

import React from "react";
import { useTheme } from "aihappey-components";

import { Markdown } from "../../../../ui/markdown/Markdown";
import { useTranslation } from "react-i18next";

export interface LoggingNotificationCardProps {
  notif: any;
}

export const LoggingNotificationCard: React.FC<
  LoggingNotificationCardProps
> = ({ notif }) => {
  const { Card } = useTheme();
  const { t } = useTranslation();
  const message = String(notif.data || "");
  return (
    <Card title={t(`logLevels.${notif.level}`)}>
      <Markdown text={message} />
    </Card>
  );
};
