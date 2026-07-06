import {
  compactObject,
  getProviderKeyFromRequestBody,
  hasConfiguredNativeTools,
  mapOpenAiResponsesTools,
  resolveNativeRequestMetadata,
  resolveOpenAiToolChoice,
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

const stringifyToolValue = (value: unknown) => {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const toolPartName = (part: any) => {
  const fromType = String(part?.type ?? "").replace(/^tool-/, "");
  return String(part?.toolName ?? part?.name ?? fromType ?? "function_call").trim() || "function_call";
};

const toolPartInput = (part: any) => part?.input ?? part?.args ?? part?.arguments ?? {};

const toolPartOutput = (part: any) => part?.output ?? part?.result;

const isOutputOnlyToolPart = (part: any) => {
  const type = String(part?.type ?? "").toLowerCase();
  const state = String(part?.state ?? "").toLowerCase();
  return type.includes("output") || state === "output-only" || state === "output_only";
};

const toResponsesToolEntries = (message: GenericMappedMessage) => message.toolParts.flatMap((part: any) => {
  if (part?.providerExecuted === true) return [];

  const callId = String(part?.toolCallId ?? part?.id ?? part?.call_id ?? "").trim();
  if (!callId) return [];

  const entries: any[] = [];
  if (!isOutputOnlyToolPart(part)) {
    entries.push(compactObject({
      type: "function_call" as const,
      call_id: callId,
      name: toolPartName(part),
      arguments: stringifyToolValue(toolPartInput(part)),
    }));
  }

  const output = toolPartOutput(part);
  if (output !== undefined) {
    entries.push({
      type: "function_call_output" as const,
      call_id: callId,
      output: stringifyToolValue(output),
    });
  }

  return entries;
});

export const buildResponsesBody = (body: GenericChatEndpointRequestBody) => {
  const messages = mapUiMessages(body.messages);
  const providerKey = getProviderKeyFromRequestBody(body);
  const providerRequestConfig = sanitizeGenericEndpointProviderRequestConfig({
    ...body,
    endpoint: "/v1/responses",
  });
  const activeTools = hasConfiguredNativeTools(providerRequestConfig)
    ? undefined
    : mapOpenAiResponsesTools(body);
  const hasTools = Boolean(activeTools?.length || providerRequestConfig?.tools?.length);
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
    const toolItems = message.role === "assistant" ? toResponsesToolEntries(message) : [];

    return [
      ...reasoningItems,
      ...(Array.isArray(messageItem.content) && messageItem.content.length > 0 ? [messageItem] : []),
      ...toolItems,
    ];
  });

  return compactObject({
    ...(providerRequestConfig ?? {}),
    model: body.model,
    temperature: body.temperature,
    max_output_tokens: body.maxOutputTokens,
    metadata: resolveNativeRequestMetadata(body),
    instructions: getSystemText(messages),
    tools: activeTools,
    tool_choice: resolveOpenAiToolChoice(body, providerRequestConfig, hasTools),
    store: false,
    input,
    stream: true,
  });
};
