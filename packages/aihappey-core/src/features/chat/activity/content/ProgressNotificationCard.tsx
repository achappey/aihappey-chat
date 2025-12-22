import React from "react";
import { useTheme } from "aihappey-components";

import { Markdown } from "../../../../ui/markdown/Markdown";

export interface ProgressNotificationCardProps {
  notif: any;
}

export const ProgressNotificationCard: React.FC<
  ProgressNotificationCardProps
> = ({ notif }) => {
  const { Card } = useTheme();

  return (
    <Card title={notif.progressToken.toString()}>
      <Markdown text={notif.message} />
    </Card>
  );
};
