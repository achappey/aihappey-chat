import React from "react";
import { LoggingNotificationCard } from "../content/LoggingNotificationCard";
import { logRuntime, useMcpLogs } from "../../../../runtime/mcp/logRuntime";

export const LoggingNotificationsActivity: React.FC = () => {
  const mcpLogs = useMcpLogs(logRuntime)

  if (!mcpLogs.length) {
    return null;
  }

  const sorted = [...mcpLogs].sort(
    (a, b) => b.timestamp - a.timestamp
  );

  return (
    <div
      className="p-3"
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      {sorted.map((n, i: number) => (
        <LoggingNotificationCard key={i} notif={n} />
      ))}
    </div>
  );
};
