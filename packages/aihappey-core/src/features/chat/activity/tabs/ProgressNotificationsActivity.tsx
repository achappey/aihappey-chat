import React from "react";
import { ProgressNotificationCard } from "../content/ProgressNotificationCard";
import { useAppStore } from "aihappey-state";

export const ProgressNotificationsActivity: React.FC = () => {
  const progress = useAppStore((a) => a.progress);

  if (!progress.length) {
    return null;
  }
  progress.reverse();
  return (
    <div
      className="p-3"
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      {progress.map((n: any, i: number) => (
        <ProgressNotificationCard key={i} notif={n} />
      ))}
    </div>
  );
};
