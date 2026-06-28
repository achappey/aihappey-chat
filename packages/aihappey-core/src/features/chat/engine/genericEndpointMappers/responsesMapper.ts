import {
  compactObject,
  getProviderKeyFromRequestBody,
  resolveNativeRequestMetadata,
  sanitizeGenericEndpointProviderRequestConfig,
  type GenericChatEndpointRequestBody,
  type GenericMappedMessage,
} from "./types";
import { getSystemText, getTextFromPart, mapUiMessages, toInlineFileData } from "./uiMessageParts";

const responsesReasoningFromPart = (part: any, providerKey?: string) => {
  if (!providerKey) return undefined;

  const encryptedContent = part?.providerMetadata?.[providerKey]?.encrypted_content;
  if (typeof encryptedContent !== "string" || !encryptedContent) return undefined;

  const summaryText = getTextFromPart(part);
  return {
    ...compactObject({
    type: "reasoning" as const,
    id: part?.id,
    encrypted_content: encryptedContent,
    }),
    summary: summaryText ? [{ type: "summary_text" as const, text: summaryText }] : [],
  };
};

const toResponsesContent = (message: GenericMappedMessage) => {
  const content: any[] = [];

  if (message.role === "assistant") {
    message.nonReasoningTextParts.forEach((text) => content.push({ type: "output_text", text }));
    return content;
  }

  if (message.text) content.push({ type: "input_text", text: message.text });

  message.fileParts.forEach((file) => {
    if (file.mimeType.startsWith("image/") && file.dataUrl) {
      content.push({ type: "input_image", image_url: file.dataUrl });
      return;
    }

    const fileData = toInlineFileData(file);
    if (fileData) content.push({ type: "input_file", file_data: fileData, filename: file.filename });
  });

  return content;
};

export const buildResponsesBody = (body: GenericChatEndpointRequestBody) => {
  const messages = mapUiMessages(body.messages);
  const providerKey = getProviderKeyFromRequestBody(body);
  const providerRequestConfig = sanitizeGenericEndpointProviderRequestConfig({
    ...body,
    endpoint: "/v1/responses",
  });
  const input = messages.flatMap((message) => {
    if (message.role === "system") return [];

    const reasoningItems = message.role === "assistant"
      ? message.reasoningParts
        .map((part) => responsesReasoningFromPart(part, providerKey))
        .filter(Boolean)
      : [];

    const messageItem = compactObject({
      type: "message" as const,
      role: message.role as "user" | "assistant",
      content: toResponsesContent(message),
    });

    return [
      ...reasoningItems,
      ...(Array.isArray(messageItem.content) && messageItem.content.length > 0 ? [messageItem] : []),
    ];
  });

  return compactObject({
    ...(providerRequestConfig ?? {}),
    model: body.model,
    temperature: body.temperature,
    max_output_tokens: body.maxOutputTokens,
    metadata: resolveNativeRequestMetadata(body),
    instructions: getSystemText(messages),
    input,
    stream: true,
  });
};
