import {
  compactObject,
  resolveNativeRequestMetadata,
  sanitizeGenericEndpointProviderRequestConfig,
  type GenericChatEndpointRequestBody,
} from "./types";
import { mapUiMessages, toInlineFileData } from "./uiMessageParts";

const toChatCompletionContent = (message: ReturnType<typeof mapUiMessages>[number]) => {
  if (message.role !== "user") return message.text;

  const contentParts: any[] = [];
  if (message.text) contentParts.push({ type: "text", text: message.text });

  message.fileParts.forEach((file) => {
    if (file.mimeType.startsWith("image/") && file.dataUrl) {
      contentParts.push({ type: "image_url", image_url: { url: file.dataUrl } });
      return;
    }

    const fileData = toInlineFileData(file);
    if (fileData) {
      contentParts.push({
        type: "file",
        file: {
          file_data: fileData,
          filename: file.filename,
        },
      });
    }
  });

  return contentParts.length === 1 && contentParts[0]?.type === "text"
    ? message.text
    : contentParts;
};

export const buildChatCompletionsBody = (body: GenericChatEndpointRequestBody) => {
  const messages = mapUiMessages(body.messages);
  const providerRequestConfig = sanitizeGenericEndpointProviderRequestConfig({
    ...body,
    endpoint: "/v1/chat/completions",
  });

  return compactObject({
    ...(providerRequestConfig ?? {}),
    model: body.model,
    temperature: body.temperature,
    max_tokens: body.maxOutputTokens,
    metadata: resolveNativeRequestMetadata(body),
    messages: messages.map((message) => compactObject({
      role: message.role,
      content: toChatCompletionContent(message),
    })),
    stream: true,
  });
};
