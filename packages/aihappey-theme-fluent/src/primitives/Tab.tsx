import * as React from "react";

export interface McpTabProps {
  eventKey: string;
  title: React.ReactNode;
  children: React.ReactNode;
}

export const Tab: React.FC<McpTabProps> = () => null;
Tab.displayName = "McpFluentTab";
