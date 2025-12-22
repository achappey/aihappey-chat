import { createContext, useContext } from "react";
import type { ChatConfig } from "./ChatProvider";

interface ChatContextType {
  config: ChatConfig;
  stopTool?: () => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = (): ChatContextType => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
};

export type { ChatConfig };
