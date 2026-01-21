/**
 * Rendered ChatMessage ids are derived from the underlying UIMessage id
 * in `toChatMessages()` (e.g. `${uiMessageId}:text:${idx}`).
 *
 * This helper extracts the original UIMessage id.
 */
export function getUiMessageIdFromChatMessageId(chatMessageId: string): string {
  const raw = String(chatMessageId ?? "");
  const i = raw.indexOf(":");
  return i === -1 ? raw : raw.slice(0, i);
}

