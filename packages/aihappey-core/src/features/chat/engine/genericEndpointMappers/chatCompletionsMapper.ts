import {
  compactObject,
  hasConfiguredNativeTools,
  mapOpenAiChatCompletionTools,
  resolveNativeRequestMetadata,
  resolveOpenAiToolChoice,
  sanitizeGenericEndpointProviderRequestConfig,
  type GenericChatEndpointRequestBody,
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

const toChatCompletionToolCalls = (message: ReturnType<typeof mapUiMessages>[number]): any[] => message.toolParts
  .filter(isClientExecutableToolPart)
  .filter((part: any) => !isOutputOnlyToolPart(part))
  .map((part: any) => {
    const toolCallId = toolPartCallId(part);
    if (!toolCallId) return undefined;

    return {
      id: toolCallId,
      type: "function" as const,
      function: {
        name: toolPartName(part, "function_call"),
        arguments: stringifyToolValue(toolPartInput(part)),
      },
    };
  })
  .filter(Boolean);

const toChatCompletionToolResultMessages = (message: ReturnType<typeof mapUiMessages>[number]): any[] => message.toolParts
  .filter(isClientExecutableToolPart)
  .filter(hasToolPartOutput)
  .map((part: any) => {
    const toolCallId = toolPartCallId(part);
    if (!toolCallId) return undefined;

    return {
      role: "tool" as const,
      tool_call_id: toolCallId,
      content: stringifyToolValue(toolPartOutput(part)),
    };
  })
  .filter(Boolean);

const toChatCompletionMessages = (messages: ReturnType<typeof mapUiMessages>): any[] => messages.flatMap((message): any[] => {
  if (message.role !== "assistant") {
    return [compactObject({
      role: message.role,
      content: toChatCompletionContent(message),
    })];
  }

  const toolCalls = toChatCompletionToolCalls(message);
  const toolResults = toChatCompletionToolResultMessages(message);
  const assistantMessage = compactObject({
    role: "assistant" as const,
    content: message.text || (toolCalls.length > 0 ? null : ""),
    tool_calls: toolCalls,
  });

  return [
    ...(message.text || toolCalls.length > 0 ? [assistantMessage] : []),
    ...toolResults,
  ];
});

export const buildChatCompletionsBody = (body: GenericChatEndpointRequestBody) => {
  const messages = mapUiMessages(body.messages);
  const providerRequestConfig = sanitizeGenericEndpointProviderRequestConfig({
    ...body,
    endpoint: body.endpoint ?? "/v1/chat/completions",
  });
  const activeTools = hasConfiguredNativeTools(providerRequestConfig)
    ? undefined
    : mapOpenAiChatCompletionTools(body);
  const hasTools = Boolean(activeTools?.length || providerRequestConfig?.tools?.length);

  return compactObject({
    ...(providerRequestConfig ?? {}),
    model: body.model,
    temperature: body.temperature,
    max_tokens: body.maxOutputTokens,
    tools: activeTools,
    tool_choice: resolveOpenAiToolChoice(body, providerRequestConfig, hasTools),
    metadata: resolveNativeRequestMetadata(body),
    messages: toChatCompletionMessages(messages),
    stream: true,
  });
};
