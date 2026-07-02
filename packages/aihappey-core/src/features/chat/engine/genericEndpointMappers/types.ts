import type { ChatEndpointId } from "aihappey-state";
import type { UIMessage } from "aihappey-ai";
import { sanitizeProviderRequestConfigForProvider } from "../../../../runtime/providers/providerRequestConfig";

export type GenericEndpointId = Exclude<ChatEndpointId, "/api/chat">;

export const GENERIC_CHAT_ENDPOINT_IDS: readonly GenericEndpointId[] = [
  "/v1/chat/completions",
  "/v1/responses",
  "/v1/messages",
  "/v1beta/interactions",
  "/paas/v4/chat/completions",
  "/v1/agents",
] as const;

export type GenericChatEndpointRequestBody = {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  providerRequestConfig?: Record<string, any>;
  omitProviderMetadataInNativeMetadata?: boolean;
  providerMetadata?: Record<string, any>;
  messages?: UIMessage[];
  [key: string]: any;
};

export type DataUrl = {
  mimeType: string;
  base64: string;
  dataUrl: string;
};

export type GenericMappedFilePart = {
  id?: string;
  filename?: string;
  mimeType: string;
  dataUrl?: string;
  base64?: string;
  url?: string;
  raw: any;
};

export type GenericMappedMessage = {
  role: "system" | "user" | "assistant";
  text: string;
  textParts: string[];
  nonReasoningTextParts: string[];
  fileParts: GenericMappedFilePart[];
  reasoningParts: any[];
  toolParts: any[];
  otherParts: any[];
  raw: UIMessage;
};

export const ANTHROPIC_THINKING_METADATA_TYPES = {
  thinking: "thinking",
  redactedThinking: "redacted_thinking",
} as const;

export const compactObject = <T extends Record<string, any>>(value: T): Partial<T> => Object.fromEntries(
  Object.entries(value).filter(([, entry]) => {
    if (entry === undefined || entry === null) return false;
    if (Array.isArray(entry)) return entry.length > 0;
    if (entry && typeof entry === "object") return Object.keys(entry).length > 0;
    return true;
  }),
) as Partial<T>;

const asRecord = (value: unknown): Record<string, any> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, any>
    : undefined;

export const resolveNativeRequestMetadata = ({
  providerMetadata,
  providerRequestConfig,
  omitProviderMetadataInNativeMetadata,
  extraMetadata,
}: {
  providerMetadata?: unknown;
  providerRequestConfig?: Record<string, any>;
  omitProviderMetadataInNativeMetadata?: boolean;
  extraMetadata?: Record<string, any>;
}) => {
  const merged = {
    ...(!omitProviderMetadataInNativeMetadata ? (asRecord(providerMetadata) ?? {}) : {}),
    ...(asRecord(providerRequestConfig?.metadata) ?? {}),
    ...(extraMetadata ?? {}),
  };

  return Object.keys(merged).length ? merged : undefined;
};

export const sanitizeGenericEndpointProviderRequestConfig = (body: GenericChatEndpointRequestBody) => {
  const providerKey = getProviderKeyFromRequestBody(body);
  return sanitizeProviderRequestConfigForProvider(body.providerRequestConfig, providerKey, {
    endpointId: body.endpoint,
  });
};

export const getProviderKeyFromRequestBody = (body: Pick<GenericChatEndpointRequestBody, "providerMetadata">) =>
  Object.keys(body.providerMetadata ?? {})[0]?.trim().toLowerCase() || undefined;
