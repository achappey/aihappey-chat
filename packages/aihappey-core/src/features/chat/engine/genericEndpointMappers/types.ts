import type { ChatEndpointId } from "aihappey-state";
import type { UIMessage } from "aihappey-ai";
import { sanitizeProviderRequestConfigForProvider } from "../../../../runtime/providers/providerRequestConfig";

export type GenericEndpointId = Exclude<ChatEndpointId, "/api/chat">;

export const GENERIC_CHAT_ENDPOINT_IDS: readonly GenericEndpointId[] = [
  "/v1/chat/completions",
  "/v1/conversations",
  "/v1/responses",
  "/v1/messages",
  "/v1beta/interactions",
  "/paas/v4/chat/completions",
  "/v1/openai/chat/completions",
  "/chat/completions",
  "/v1/agents",
] as const;

export type GenericChatEndpointRequestBody = {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  toolChoice?: unknown;
  tools?: any[];
  providerRequestConfig?: Record<string, any>;
  providerRequestConfigProviderKey?: string;
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

const hasOwn = (value: Record<string, any> | undefined, key: string) =>
  !!value && Object.prototype.hasOwnProperty.call(value, key);

const parseJsonObject = (value: unknown): Record<string, any> | undefined => {
  if (typeof value !== "string" || !value.trim()) return undefined;

  try {
    return asRecord(JSON.parse(value));
  } catch {
    return undefined;
  }
};

const toolParameters = (tool: any) =>
  asRecord(tool?.inputSchema)
  ?? parseJsonObject(tool?.inputSchema)
  ?? asRecord(tool?.parameters)
  ?? parseJsonObject(tool?.parameters)
  ?? { type: "object", properties: {} };

const toolDescription = (tool: any) => {
  const description = typeof tool?.description === "string" ? tool.description.trim() : "";
  if (description) return description;

  const title = typeof tool?.annotations?.title === "string" ? tool.annotations.title.trim() : "";
  return title || undefined;
};

const nativeFunctionTools = (body: GenericChatEndpointRequestBody) => {
  if (normalizeToolChoice(body.toolChoice) === "none") return [];

  return (Array.isArray(body.tools) ? body.tools : [])
    .map((tool) => {
      const name = typeof tool?.name === "string" ? tool.name.trim() : "";
      if (!name) return undefined;

      return compactObject({
        name,
        description: toolDescription(tool),
        parameters: toolParameters(tool),
      });
    })
    .filter(Boolean);
};

export const hasConfiguredNativeTools = (providerRequestConfig?: Record<string, any>) =>
  hasOwn(providerRequestConfig, "tools");

export const hasConfiguredNativeToolChoice = (providerRequestConfig?: Record<string, any>) =>
  hasOwn(providerRequestConfig, "tool_choice") || hasOwn(providerRequestConfig, "toolChoice");

export const normalizeToolChoice = (toolChoice: unknown) => {
  if (typeof toolChoice !== "string") return toolChoice;
  const normalized = toolChoice.trim().toLowerCase();
  return normalized || undefined;
};

export const mapOpenAiChatCompletionTools = (body: GenericChatEndpointRequestBody) =>
  nativeFunctionTools(body).map((tool) => ({
    type: "function" as const,
    function: tool,
  }));

export const mapOpenAiResponsesTools = (body: GenericChatEndpointRequestBody) =>
  nativeFunctionTools(body).map((tool) => ({
    type: "function" as const,
    ...tool,
  }));

export const mapAnthropicMessagesTools = (body: GenericChatEndpointRequestBody) =>
  nativeFunctionTools(body).map((tool: any) => compactObject({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
  }));

export const mapGenericFunctionTools = (body: GenericChatEndpointRequestBody) =>
  nativeFunctionTools(body).map((tool) => ({
    type: "function" as const,
    ...tool,
  }));

export const resolveOpenAiToolChoice = (
  body: GenericChatEndpointRequestBody,
  providerRequestConfig?: Record<string, any>,
  hasTools = false,
) => {
  if (hasConfiguredNativeToolChoice(providerRequestConfig)) return undefined;
  const toolChoice = normalizeToolChoice(body.toolChoice);
  if (toolChoice === "none") return "none";
  if (!hasTools) return undefined;
  return toolChoice === "auto" || toolChoice === "required" ? toolChoice : undefined;
};

export const resolveAnthropicToolChoice = (
  body: GenericChatEndpointRequestBody,
  providerRequestConfig?: Record<string, any>,
  hasTools = false,
) => {
  if (hasConfiguredNativeToolChoice(providerRequestConfig)) return undefined;
  const toolChoice = normalizeToolChoice(body.toolChoice);
  if (toolChoice === "none") return { type: "none" };
  if (!hasTools) return undefined;
  if (toolChoice === "auto") return { type: "auto" };
  if (toolChoice === "required") return { type: "any" };
  return undefined;
};

export const resolveGenericToolChoice = (
  body: GenericChatEndpointRequestBody,
  providerRequestConfig?: Record<string, any>,
  hasTools = false,
) => {
  if (hasConfiguredNativeToolChoice(providerRequestConfig)) return undefined;
  const toolChoice = normalizeToolChoice(body.toolChoice);
  if (toolChoice === "none") return "none";
  if (!hasTools) return undefined;
  return toolChoice === "auto" || toolChoice === "required" ? toolChoice : undefined;
};

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
  if (!body.providerRequestConfig || body.omitProviderMetadataInNativeMetadata !== true) return undefined;

  const providerKey = String(body.providerRequestConfigProviderKey ?? "").trim().toLowerCase()
    || getProviderKeyFromRequestBody(body);
  return sanitizeProviderRequestConfigForProvider(body.providerRequestConfig, providerKey, {
    endpointId: body.endpoint,
  });
};

export const getProviderKeyFromRequestBody = (body: Pick<GenericChatEndpointRequestBody, "providerMetadata">) =>
  Object.keys(body.providerMetadata ?? {})[0]?.trim().toLowerCase() || undefined;
