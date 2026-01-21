import { useConversations } from "./ConversationsProvider";

/**
 * Temporary compatibility shim.
 *
 * In dev, TypeScript can lag behind workspace builds and not pick up the new
 * `removeMessage()` typing on `useConversations()` immediately.
 */
export function useRemoveMessage(): (cid: string, mid: string) => Promise<void> {
  const ctx = useConversations() as any;
  return ctx.removeMessage as (cid: string, mid: string) => Promise<void>;
}

