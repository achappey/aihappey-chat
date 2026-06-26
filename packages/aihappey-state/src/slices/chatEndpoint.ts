export const CHAT_ENDPOINT_IDS = [
  "/api/chat",
  "/v1/chat/completions",
  "/v1/responses",
  "/v1/messages",
] as const;

export type ChatEndpointId = typeof CHAT_ENDPOINT_IDS[number];

export const CHAT_ENDPOINT_MODES = ["default", "direct"] as const;

export type ChatEndpointMode = typeof CHAT_ENDPOINT_MODES[number];

export const DEFAULT_CHAT_ENDPOINT_ID: ChatEndpointId = "/api/chat";

export const DEFAULT_CHAT_ENDPOINT_MODE: ChatEndpointMode = "default";

export function isChatEndpointId(value: unknown): value is ChatEndpointId {
  return typeof value === "string" && (CHAT_ENDPOINT_IDS as readonly string[]).includes(value);
}

export function normalizeChatEndpointId(value: unknown): ChatEndpointId | undefined {
  return isChatEndpointId(value) ? value : undefined;
}

export function isChatEndpointMode(value: unknown): value is ChatEndpointMode {
  return typeof value === "string" && (CHAT_ENDPOINT_MODES as readonly string[]).includes(value);
}

export function normalizeChatEndpointMode(value: unknown): ChatEndpointMode | undefined {
  return isChatEndpointMode(value) ? value : undefined;
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

export function resolveEffectiveChatEndpointMode(
  configured?: unknown,
  selected?: unknown,
): ChatEndpointMode {
  return normalizeChatEndpointMode(selected)
    ?? normalizeChatEndpointMode(configured)
    ?? DEFAULT_CHAT_ENDPOINT_MODE;
}
