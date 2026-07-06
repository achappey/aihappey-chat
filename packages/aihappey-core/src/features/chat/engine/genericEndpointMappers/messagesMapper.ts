import {
  ANTHROPIC_THINKING_METADATA_TYPES,
  compactObject,
  getProviderKeyFromRequestBody,
  hasConfiguredNativeTools,
  mapAnthropicMessagesTools,
  resolveNativeRequestMetadata,
  resolveAnthropicToolChoice,
  sanitizeGenericEndpointProviderRequestConfig,
  type GenericChatEndpointRequestBody,
  type GenericMappedFilePart,
  type GenericMappedMessage,
} from "./types";
import { getSystemText, getTextFromPart, mapUiMessages, parseDataUrl } from "./uiMessageParts";

const toAnthropicFileBlocks = (file: GenericMappedFilePart) => {
  if (file.mimeType.startsWith("image/") && file.dataUrl) {
    const parsed = parseDataUrl(file.dataUrl);
    if (!parsed) return [];
    return [{
      type: "image",
      source: {
        type: "base64",
        media_type: parsed.mimeType,
        data: parsed.base64,
      },
    }];
  }

  if (file.mimeType === "application/pdf" && file.base64) {
    return [{
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: file.base64,
      },
      title: file.filename,
    }];
  }

  const text = typeof file.raw?.textContent === "string" ? file.raw.textContent : undefined;
  if (file.mimeType.startsWith("text/") && text) {
    return [{
      type: "document",
      source: {
        type: "text",
        media_type: "text/plain",
        data: text,
      },
      title: file.filename,
    }];
  }

  return [];
};

const messagesReasoningFromPart = (part: any, providerKey?: string) => {
  if (!providerKey) return undefined;

  const providerMetadata = part?.providerMetadata?.[providerKey];
  if (!providerMetadata || typeof providerMetadata !== "object") return undefined;

  const metadataType = providerMetadata.type;
  const redactedData = providerMetadata.data;
  if (metadataType === ANTHROPIC_THINKING_METADATA_TYPES.redactedThinking && typeof redactedData === "string" && redactedData) {
    return {
      type: "redacted_thinking" as const,
      data: redactedData,
    };
  }

  const signature = providerMetadata.signature;
  if (typeof signature !== "string" || !signature) return undefined;

  return {
    type: "thinking" as const,
    thinking: getTextFromPart(part),
    signature,
  };
};

const toAnthropicContentBlocks = (message: GenericMappedMessage, providerKey?: string) => {
  const blocks: any[] = [];

  if (message.role === "assistant") {
    blocks.push(
      ...message.reasoningParts
        .map((part) => messagesReasoningFromPart(part, providerKey))
        .filter(Boolean),
    );
    message.nonReasoningTextParts.forEach((text) => blocks.push({ type: "text", text }));
    return blocks;
  }

  if (message.text) blocks.push({ type: "text", text: message.text });

  if (message.role === "user") {
    blocks.push(...message.fileParts.flatMap(toAnthropicFileBlocks));
  }

  return blocks;
};

export const buildMessagesBody = (body: GenericChatEndpointRequestBody) => {
  const messages = mapUiMessages(body.messages);
  const providerKey = getProviderKeyFromRequestBody(body);
  const providerRequestConfig = sanitizeGenericEndpointProviderRequestConfig({
    ...body,
    endpoint: "/v1/messages",
  });
  const activeTools = hasConfiguredNativeTools(providerRequestConfig)
    ? undefined
    : mapAnthropicMessagesTools(body);
  const hasTools = Boolean(activeTools?.length || providerRequestConfig?.tools?.length);

  return compactObject({
    ...(providerRequestConfig ?? {}),
    model: body.model,
    system: getSystemText(messages),
    temperature: body.temperature,
    max_tokens: body.maxOutputTokens ?? 1024,
    metadata: resolveNativeRequestMetadata({
      ...body,
      extraMetadata: compactObject({
        user_id: body.metadata?.user_id,
      }),
    }),
    messages: messages
      .filter((message) => message.role !== "system")
      .map((message) => compactObject({
        role: message.role as "user" | "assistant",
        content: toAnthropicContentBlocks(message, providerKey),
      }))
      .filter((message: any) => Array.isArray(message.content) && message.content.length > 0),
    tools: activeTools,
    tool_choice: resolveAnthropicToolChoice(body, providerRequestConfig, hasTools),
    stream: true,
  });
};
