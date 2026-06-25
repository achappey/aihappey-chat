export const CHAT_ENDPOINT_IDS = [
  "/api/chat",
  "/v1/chat/completions",
  "/v1/responses",
  "/v1/messages",
] as const;

export type ChatEndpointId = typeof CHAT_ENDPOINT_IDS[number];

export const DEFAULT_CHAT_ENDPOINT_ID: ChatEndpointId = "/api/chat";

export function isChatEndpointId(value: unknown): value is ChatEndpointId {
  return typeof value === "string" && (CHAT_ENDPOINT_IDS as readonly string[]).includes(value);
}

export function normalizeChatEndpointId(value: unknown): ChatEndpointId | undefined {
  return isChatEndpointId(value) ? value : undefined;
}

export function resolveEffectiveChatEndpointId(
  configured?: unknown,
  selected?: unknown,
): ChatEndpointId {
  return normalizeChatEndpointId(selected)
    ?? normalizeChatEndpointId(configured)
    ?? DEFAULT_CHAT_ENDPOINT_ID;
}

export function normalizeBaseUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export function resolveEffectiveBaseUrl(
  configured?: unknown,
  selected?: unknown,
): string {
  return normalizeBaseUrl(selected) ?? normalizeBaseUrl(configured) ?? "";
}
