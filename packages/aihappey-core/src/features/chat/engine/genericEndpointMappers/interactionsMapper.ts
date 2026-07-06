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

  return steps;
};

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
  const activeTools = hasConfiguredNativeTools(providerRequestConfig)
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
