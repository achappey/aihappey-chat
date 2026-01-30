import type { ReactNode } from "react";

type WebAppDetailChatTabProps = {
  children: ReactNode;
};

export const WebAppDetailChatTab = ({ children }: WebAppDetailChatTabProps) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      minHeight: 0,
      flex: 1,
      overflow: "hidden",
    }}
  >
    {children}
  </div>
);
