import {
  ANTHROPIC_THINKING_METADATA_TYPES,
  compactObject,
  getProviderKeyFromRequestBody,
  hasConfiguredNativeTools,
  mapAnthropicMessagesTools,
  mergeNativeTools,
  resolveNativeRequestMetadata,
  resolveAnthropicToolChoice,
  sanitizeGenericEndpointProviderRequestConfig,
  type GenericChatEndpointRequestBody,
  type GenericMappedFilePart,
  type GenericMappedMessage,
} from "./types";
import {
  hasToolPartOutput,
  isClientExecutableToolPart,
  isOutputOnlyToolPart,
  stringifyToolValue,
  toolPartCallId,
  toolPartInput,
  toolPartName,
  toolPartOutput,
} from "./toolParts";
import { getSystemText, getTextFromPart, mapUiMessages, parseDataUrl } from "./uiMessageParts";
import {
  CLIENT_TOOL_SEARCH_NAME,
  selectedToolsFromClientToolSearchResult,
} from "../../../tools/clientToolSearch";

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

const toAnthropicToolUseBlocks = (message: GenericMappedMessage): any[] => message.toolParts
  .filter(isClientExecutableToolPart)
  .filter((part: any) => !isOutputOnlyToolPart(part))
  .map((part: any) => {
    const toolUseId = toolPartCallId(part);
    if (!toolUseId) return undefined;

    return {
      type: "tool_use" as const,
      id: toolUseId,
      name: toolPartName(part, "tool"),
      input: toolPartInput(part),
    };
  })
  .filter(Boolean);

const toAnthropicToolResultMessages = (message: GenericMappedMessage): any[] => message.toolParts
  .filter(isClientExecutableToolPart)
  .filter(hasToolPartOutput)
  .map((part: any) => {
    const toolUseId = toolPartCallId(part);
    if (!toolUseId) return undefined;

    const output = toolPartOutput(part);
    const isClientToolSearch = toolPartName(part, "tool") === CLIENT_TOOL_SEARCH_NAME;
    const selectedTools = isClientToolSearch
      ? selectedToolsFromClientToolSearchResult(output)
      : undefined;

    return compactObject({
      role: "user" as const,
      content: [compactObject({
        type: "tool_result" as const,
        tool_use_id: toolUseId,
        content: selectedTools
          ? selectedTools.map((tool: any) => ({
            type: "tool_reference",
            tool_name: tool.name,
          }))
          : stringifyToolValue(output),
        is_error: String(part?.state ?? "").toLowerCase() === "output-error" ? true : undefined,
      })],
    });
  })
  .filter(Boolean);

const toAnthropicMessages = (messages: GenericMappedMessage[], providerKey?: string): any[] => messages
  .filter((message) => message.role !== "system")
  .flatMap((message): any[] => {
    if (message.role !== "assistant") {
      const content = toAnthropicContentBlocks(message, providerKey);
      return content.length > 0
        ? [compactObject({ role: message.role as "user", content })]
        : [];
    }

    const content = [
      ...toAnthropicContentBlocks(message, providerKey),
      ...toAnthropicToolUseBlocks(message),
    ];
    const toolResults = toAnthropicToolResultMessages(message);

    return [
      ...(content.length > 0 ? [compactObject({ role: "assistant" as const, content })] : []),
      ...toolResults,
    ];
  });

export const buildMessagesBody = (body: GenericChatEndpointRequestBody) => {
  const messages = mapUiMessages(body.messages);
  const providerKey = getProviderKeyFromRequestBody(body);
  const providerRequestConfig = sanitizeGenericEndpointProviderRequestConfig({
    ...body,
    endpoint: "/v1/messages",
  });
  const activeTools = hasConfiguredNativeTools(providerRequestConfig)
    ? mergeNativeTools(providerRequestConfig?.tools, mapAnthropicMessagesTools(body))
    : mapAnthropicMessagesTools(body);
  const hasTools = Boolean(activeTools?.length);

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
    messages: toAnthropicMessages(messages, providerKey),
    tools: activeTools,
    tool_choice: resolveAnthropicToolChoice(body, providerRequestConfig, hasTools),
    stream: true,
  });
};
