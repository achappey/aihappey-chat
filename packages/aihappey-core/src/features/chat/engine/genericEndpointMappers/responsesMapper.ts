import {
  compactObject,
  resolveNativeRequestMetadata,
  type GenericChatEndpointRequestBody,
  type GenericMappedMessage,
} from "./types";
import { getSystemText, mapUiMessages, toInlineFileData } from "./uiMessageParts";

const toResponsesContent = (message: GenericMappedMessage) => {
  const content: any[] = [];

  if (message.role === "assistant") {
    if (message.text) content.push({ type: "output_text", text: message.text });
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
  const input = messages
    .filter((message) => message.role !== "system")
    .map((message) => compactObject({
      type: "message" as const,
      role: message.role as "user" | "assistant",
      content: toResponsesContent(message),
    }))
    .filter((message: any) => Array.isArray(message.content) && message.content.length > 0);

  return compactObject({
    ...(body.providerRequestConfig ?? {}),
    model: body.model,
    temperature: body.temperature,
    max_output_tokens: body.maxOutputTokens,
    metadata: resolveNativeRequestMetadata(body),
    instructions: getSystemText(messages),
    input,
    stream: true,
  });
};
