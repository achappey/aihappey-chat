import { useAppStore } from "aihappey-state";

// Returns: { errors, dismissError }
export function useChatErrors() {
  const errors = useAppStore((s) => s.chatErrors);
  const addChatError = useAppStore((s) => s.addChatError);
  const dismissError = useAppStore((s) => s.dismissChatError);
  return { errors, dismissError, addChatError };
}
