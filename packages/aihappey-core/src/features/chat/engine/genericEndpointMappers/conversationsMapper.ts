import {
  compactObject,
  hasConfiguredNativeTools,
  mapMistralConversationTools,
  mergeNativeTools,
  resolveNativeRequestMetadata,
  sanitizeGenericEndpointProviderRequestConfig,
  type GenericChatEndpointRequestBody,
  type GenericMappedFilePart,
  type GenericMappedMessage,
} from "./types";
import {
  asRecord,
  isClientExecutableToolPart,
  isOutputOnlyToolPart,
  nonEmptyString,
  stringifyToolValue,
  toolPartCallId,
  toolPartInput,
  toolPartName,
  toolPartOutput,
} from "./toolParts";
import { getSystemText, mapUiMessages, toInlineFileData } from "./uiMessageParts";

const nativeMistralContentBlock = (value: any) => {
  const metadata = asRecord(value?.providerMetadata?.mistral)
    ?? asRecord(value?.metadata?.mistral)
    ?? asRecord(value?.providerMetadata?.Mistral)
    ?? asRecord(value?.metadata?.Mistral);
  const raw = metadata?.raw
    ?? metadata?.content_block
    ?? metadata?.contentBlock
    ?? metadata?.["mistral.raw"]
    ?? value?.metadata?.["mistral.raw"]
    ?? value?.providerMetadata?.["mistral.raw"];
  return asRecord(raw);
};

const toConversationFileContentPart = (file: GenericMappedFilePart) => {
  const native = nativeMistralContentBlock(file.raw);
  if (native) return native;

  const fileUrl = nonEmptyString(file.url ?? file.dataUrl);
  if (file.mimeType.startsWith("image/") && fileUrl) {
    return {
      type: "image_url",
      image_url: fileUrl,
    };
  }

  if (fileUrl?.startsWith("http://") || fileUrl?.startsWith("https://")) {
    return compactObject({
      type: "document_url",
      document_url: fileUrl,
      document_name: file.filename,
    });
  }

  const textContent = nonEmptyString(file.raw?.textContent ?? file.raw?.text);
  if (textContent) {
    return {
      type: "text",
      text: textContent,
    };
  }

  const inlineData = toInlineFileData(file);
  if (inlineData && file.mimeType.startsWith("image/")) {
    return {
      type: "image_url",
      image_url: inlineData,
    };
  }

  return undefined;
};

const toConversationMessageContent = (message: GenericMappedMessage) => {
  const content: any[] = [];

  message.nonReasoningTextParts.forEach((text) => content.push({ type: "text", text }));
  message.reasoningParts.forEach((part) => {
    const text = nonEmptyString(part?.text ?? part?.content ?? part?.output_text);
    if (text) content.push({ type: "text", text });
  });
  message.fileParts
    .map(toConversationFileContentPart)
    .filter(Boolean)
    .forEach((part) => content.push(part));

  return content;
};

const toConversationToolEntries = (message: GenericMappedMessage) => message.toolParts.flatMap((part: any) => {
  if (!isClientExecutableToolPart(part)) return [];

  const toolCallId = toolPartCallId(part);
  if (!toolCallId) return [];

  const entries: any[] = [];
  if (!isOutputOnlyToolPart(part)) {
    entries.push({
      type: "function.call",
      tool_call_id: toolCallId,
      name: toolPartName(part),
      arguments: stringifyToolValue(toolPartInput(part)),
    });
  }

  const output = toolPartOutput(part);
  if (output !== undefined) {
    entries.push({
      type: "function.result",
      tool_call_id: toolCallId,
      result: stringifyToolValue(output),
    });
  }

  return entries;
});

const toConversationInputs = (messages: GenericMappedMessage[]) => messages.flatMap((message) => {
  if (message.role === "system") return [];

  const entries: any[] = [];
  const content = toConversationMessageContent(message);
  if (content.length) {
    entries.push({
      type: "message.input",
      role: message.role as "user" | "assistant",
      content,
    });
  }

  entries.push(...toConversationToolEntries(message));
  return entries;
});

const completionArgsFrom = (
  body: GenericChatEndpointRequestBody,
  providerRequestConfig?: Record<string, any>,
) => {
  const configured = asRecord(providerRequestConfig?.completion_args) ?? {};
  return compactObject({
    ...configured,
    temperature: body.temperature ?? configured.temperature,
    max_tokens: body.maxOutputTokens ?? configured.max_tokens,
    top_p: body.topP ?? providerRequestConfig?.top_p ?? configured.top_p,
    tool_choice: body.toolChoice ?? providerRequestConfig?.tool_choice ?? configured.tool_choice,
    random_seed: providerRequestConfig?.random_seed ?? configured.random_seed,
    frequency_penalty: providerRequestConfig?.frequency_penalty ?? configured.frequency_penalty,
    presence_penalty: providerRequestConfig?.presence_penalty ?? configured.presence_penalty,
    reasoning_effort: providerRequestConfig?.reasoning_effort ?? configured.reasoning_effort,
    response_format: body.responseFormat ?? providerRequestConfig?.response_format ?? configured.response_format,
  });
};

const withoutCompletionArgSourceKeys = (config?: Record<string, any>) => {
  if (!config) return undefined;
  const {
    completion_args,
    frequency_penalty,
    presence_penalty,
    random_seed,
    reasoning_effort,
    response_format,
    tool_choice,
    top_p,
    ...rest
  } = config;
  void completion_args;
  void frequency_penalty;
  void presence_penalty;
  void random_seed;
  void reasoning_effort;
  void response_format;
  void tool_choice;
  void top_p;
  return rest;
};

export const buildConversationsBody = (body: GenericChatEndpointRequestBody) => {
  const messages = mapUiMessages(body.messages);
  const providerRequestConfig = sanitizeGenericEndpointProviderRequestConfig({
    ...body,
    endpoint: "/v1/conversations",
  });
  const requestConfig = withoutCompletionArgSourceKeys(providerRequestConfig);
  const completion_args = completionArgsFrom(body, providerRequestConfig);
  const nativeInputs = Array.isArray(providerRequestConfig?.inputs)
    ? providerRequestConfig?.inputs
    : Array.isArray(body.inputs)
      ? body.inputs
      : undefined;
  const agentId = nonEmptyString(providerRequestConfig?.agent_id ?? body.agent_id);
  const activeTools = hasConfiguredNativeTools(providerRequestConfig)
    ? mergeNativeTools(providerRequestConfig?.tools, mapMistralConversationTools(body))
    : mapMistralConversationTools(body);

  return compactObject({
    ...(requestConfig ?? {}),
    model: agentId ? undefined : body.model,
    agent_id: agentId,
    instructions: getSystemText(messages) ?? providerRequestConfig?.instructions,
    inputs: nativeInputs ?? toConversationInputs(messages),
    tools: activeTools,
    completion_args,
    metadata: resolveNativeRequestMetadata(body),
    stream: true,
    store: false,
  });
};
