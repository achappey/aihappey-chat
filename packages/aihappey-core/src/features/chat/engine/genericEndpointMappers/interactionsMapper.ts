import {
  compactObject,
  getProviderKeyFromRequestBody,
  hasConfiguredNativeTools,
  mapGenericFunctionTools,
  resolveGenericToolChoice,
  sanitizeGenericEndpointProviderRequestConfig,
  type GenericChatEndpointRequestBody,
  type GenericMappedFilePart,
  type GenericMappedMessage,
} from "./types";
import {
  asRecord,
  hasToolPartOutput,
  isClientExecutableToolPart,
  isOutputOnlyToolPart,
  stringifyToolValue,
  toolPartCallId,
  toolPartInput,
  toolPartName,
  toolPartOutput,
} from "./toolParts";
import { getSystemText, getTextFromPart, mapUiMessages } from "./uiMessageParts";

const INTERACTIONS_GENERATION_CONFIG_KEYS = [
  "top_p",
  "topP",
  "seed",
  "stop_sequences",
  "stopSequences",
  "thinking_level",
  "thinkingLevel",
  "thinking_summaries",
  "thinkingSummaries",
  "speech_config",
  "speechConfig",
  "presence_penalty",
  "presencePenalty",
  "frequency_penalty",
  "frequencyPenalty",
  "tool_choice",
  "toolChoice",
] as const;

const INTERACTIONS_TOP_LEVEL_CONFIG_KEYS = [
  "agent",
  "tools",
  "response_format",
  "store",
  "background",
  "agent_config",
  "cached_content",
  "environment",
  "previous_interaction_id",
  "response_modalities",
  "service_tier",
  "webhook_config",
] as const;

const camelToSnake = (value: string) => value.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);

const pickSnakeCaseConfig = (source: Record<string, any> | undefined, keys: readonly string[]) => {
  const result: Record<string, any> = {};
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined) result[camelToSnake(key)] = value;
  }
  return compactObject(result);
};

const stripGoogleProviderPrefix = (model?: string) => {
  const value = String(model ?? "").trim();
  return value.toLowerCase().startsWith("google/") ? value.slice("google/".length) : value;
};

const toInteractionsFileContent = (file: GenericMappedFilePart) => {
  const base = compactObject({
    data: file.base64,
    uri: file.url && !file.url.startsWith("data:") ? file.url : undefined,
    mime_type: file.mimeType,
  });

  if (file.mimeType.startsWith("image/")) return compactObject({ type: "image", ...base });
  if (file.mimeType.startsWith("audio/")) return compactObject({ type: "audio", ...base });
  if (file.mimeType.startsWith("video/")) return compactObject({ type: "video", ...base });
  if (file.mimeType === "application/pdf" || file.mimeType === "text/csv") return compactObject({ type: "document", ...base });

  const text = typeof file.raw?.textContent === "string" ? file.raw.textContent : undefined;
  return text
    ? { type: "text" as const, text }
    : compactObject({ type: "document", ...base });
};

const interactionsThoughtFromPart = (part: any, providerKey?: string) => {
  if (!providerKey) return undefined;

  const providerMetadata = part?.providerMetadata?.[providerKey];
  if (!providerMetadata || typeof providerMetadata !== "object") return undefined;

  const signature = providerMetadata.signature ?? providerMetadata.thought_signature;
  const summaryText = getTextFromPart(part);
  if (typeof signature !== "string" && !summaryText) return undefined;

  return compactObject({
    type: "thought" as const,
    signature: typeof signature === "string" && signature ? signature : undefined,
    summary: summaryText ? [{ type: "text" as const, text: summaryText }] : undefined,
  });
};

const toInteractionsContent = (message: GenericMappedMessage) => {
  const content: any[] = [];
  const textParts = message.role === "assistant" ? message.nonReasoningTextParts : message.textParts;
  textParts.forEach((text) => content.push({ type: "text", text }));

  if (message.role === "user") {
    content.push(...message.fileParts.map(toInteractionsFileContent).filter(Boolean));
  }

  return content;
};

const toInteractionsSteps = (message: GenericMappedMessage, providerKey?: string) => {
  const content = toInteractionsContent(message);
  const steps: any[] = [];

  if (message.role === "assistant") {
    steps.push(
      ...message.reasoningParts
        .map((part) => interactionsThoughtFromPart(part, providerKey))
        .filter(Boolean),
    );
  }

  if (content.length > 0) {
    steps.push({
      type: message.role === "assistant" ? "model_output" : "user_input",
      content,
    });
  }

  if (message.role === "assistant") {
    steps.push(...toInteractionsToolSteps(message, providerKey));
  }

  return steps;
};

const toInteractionsToolSteps = (message: GenericMappedMessage, providerKey?: string) => message.toolParts.flatMap((part: any) => {
  if (!isClientExecutableToolPart(part)) return [];

  const callId = toolPartCallId(part);
  if (!callId) return [];

  const steps: any[] = [];
  if (!isOutputOnlyToolPart(part)) {
    steps.push(compactObject({
      type: "function_call" as const,
      id: callId,
      name: toolPartName(part, "function"),
      arguments: toolPartInput(part),
      signature: interactionsToolPartSignature(part, providerKey),
    }));
  }

  if (hasToolPartOutput(part)) {
    steps.push(compactObject({
      type: "function_result" as const,
      call_id: callId,
      name: toolPartName(part, "function"),
      result: [{ type: "text" as const, text: interactionFunctionResultText(toolPartOutput(part)) }],
      is_error: String(part?.state ?? "").toLowerCase() === "output-error" ? true : undefined,
    }));
  }

  return steps;
});

const interactionsToolPartSignature = (part: any, providerKey?: string) => {
  const scoped = providerKey
    ? asRecord(part?.callProviderMetadata?.[providerKey])
      ?? asRecord(part?.providerMetadata?.[providerKey])
      ?? asRecord(part?.resultProviderMetadata?.[providerKey])
    : undefined;
  return scoped?.signature ?? scoped?.thought_signature ?? part?.signature;
};

const interactionFunctionResultText = (output: unknown): string => {
  if (output === undefined || output === null) return "{}";
  if (typeof output === "string") return output;

  const record = asRecord(output);
  if (record) {
    const structuredContent = record.structuredContent ?? record.structured_content;
    if (structuredContent !== undefined && structuredContent !== null) return stringifyToolValue(structuredContent);

    const contentText = interactionContentArrayText(record.content);
    if (contentText) return contentText;

    const resultText = interactionContentArrayText(record.result);
    if (resultText) return resultText;

    if (record.text !== undefined && record.text !== null) return stringifyToolValue(record.text);
  }

  const arrayText = interactionContentArrayText(output);
  return arrayText || stringifyToolValue(output);
};

const interactionContentArrayText = (value: unknown): string | undefined => {
  if (!Array.isArray(value)) return undefined;

  const parts = value
    .map(interactionContentItemText)
    .filter((text): text is string => typeof text === "string" && text.trim().length > 0);

  return parts.length > 0 ? parts.join("\n") : undefined;
};

const interactionContentItemText = (item: unknown): string | undefined => {
  if (item === undefined || item === null) return undefined;
  if (typeof item === "string") return item;
  const record = asRecord(item);
  if (!record) return stringifyToolValue(item);

  if (record.text !== undefined && record.text !== null) return stringifyToolValue(record.text);

  const resource = asRecord(record.resource);
  if (resource?.text !== undefined && resource.text !== null) return stringifyToolValue(resource.text);

  const nestedContentText = interactionContentArrayText(record.content);
  return nestedContentText || stringifyToolValue(item);
};

const hasInteractionsFunctionResult = (messages: GenericMappedMessage[]) => messages.some((message) =>
  message.toolParts.some((part: any) => isClientExecutableToolPart(part) && hasToolPartOutput(part)),
);

export const buildInteractionsBody = (body: GenericChatEndpointRequestBody) => {
  const messages = mapUiMessages(body.messages);
  const providerKey = getProviderKeyFromRequestBody(body);
  const providerRequestConfig = sanitizeGenericEndpointProviderRequestConfig({
    ...body,
    endpoint: "/v1beta/interactions",
  });
  const passthroughConfig = { ...(providerRequestConfig ?? {}) };
  for (const key of [...INTERACTIONS_GENERATION_CONFIG_KEYS, ...INTERACTIONS_TOP_LEVEL_CONFIG_KEYS]) {
    delete passthroughConfig[key];
    delete passthroughConfig[camelToSnake(key)];
  }
  const providerGenerationConfig = providerRequestConfig?.generation_config ?? providerRequestConfig?.generationConfig;
  const generationConfig = compactObject({
    ...(providerGenerationConfig && typeof providerGenerationConfig === "object" && !Array.isArray(providerGenerationConfig)
      ? providerGenerationConfig
      : {}),
    ...pickSnakeCaseConfig(providerRequestConfig, INTERACTIONS_GENERATION_CONFIG_KEYS),
    temperature: body.temperature,
    max_output_tokens: body.maxOutputTokens,
  });
  const topLevelConfig = pickSnakeCaseConfig(providerRequestConfig, INTERACTIONS_TOP_LEVEL_CONFIG_KEYS);
  const agent = typeof topLevelConfig.agent === "string" ? topLevelConfig.agent : undefined;
  const hasClientFunctionResults = hasInteractionsFunctionResult(messages);
  const activeTools = hasConfiguredNativeTools(providerRequestConfig)
    ? undefined
    : hasClientFunctionResults
      ? undefined
      : mapGenericFunctionTools(body);
  const hasTools = Boolean(activeTools?.length || topLevelConfig.tools?.length);

  return compactObject({
    ...passthroughConfig,
    ...topLevelConfig,
    tools: topLevelConfig.tools ?? activeTools,
    model: agent ? undefined : stripGoogleProviderPrefix(body.model),
    input: messages
      .filter((message) => message.role !== "system")
      .flatMap((message) => toInteractionsSteps(message, providerKey)),
    system_instruction: getSystemText(messages),
    generation_config: agent ? undefined : compactObject({
      ...generationConfig,
      tool_choice: resolveGenericToolChoice(body, providerRequestConfig, hasTools),
    }),
    stream: true,
    store: false,
  });
};
