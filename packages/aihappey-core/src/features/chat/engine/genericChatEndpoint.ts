import type { ChatEndpointId } from "aihappey-state";
import type { Provider } from "aihappey-types";
import { DefaultChatTransport } from "aihappey-ai";
import { extractPlaygroundStreamText } from "../../playground/playgroundChat";
import { buildGenericChatEndpointBody, type GenericEndpointId } from "./genericEndpointMappers";
import { ANTHROPIC_THINKING_METADATA_TYPES, GENERIC_CHAT_ENDPOINT_IDS, compactObject } from "./genericEndpointMappers/types";

type ResponseProviderStreamContext = {
  event: any;
  eventName?: string;
  endpoint: GenericEndpointId;
  requestModel?: string;
};

type ResponseProviderStreamOverride = (context: ResponseProviderStreamContext) => boolean | void;

const RESPONSE_PROVIDER_STREAM_OVERRIDES: Record<string, ResponseProviderStreamOverride> = {};

export const registerResponseProviderStreamOverride = (
  providerKey: string,
  override: ResponseProviderStreamOverride,
) => {
  const normalizedProviderKey = String(providerKey ?? "").trim().toLowerCase();
  if (!normalizedProviderKey) return () => undefined;

  RESPONSE_PROVIDER_STREAM_OVERRIDES[normalizedProviderKey] = override;
  return () => {
    if (RESPONSE_PROVIDER_STREAM_OVERRIDES[normalizedProviderKey] === override) {
      delete RESPONSE_PROVIDER_STREAM_OVERRIDES[normalizedProviderKey];
    }
  };
};

const normalizeProviderKey = (value?: string) => String(value ?? "").trim().toLowerCase() || undefined;

const providerKeyFromModel = (modelId?: string) => normalizeProviderKey(String(modelId ?? "").split("/")[0]);

export const isGenericChatEndpoint = (endpoint: ChatEndpointId | string | undefined): endpoint is GenericEndpointId =>
  (GENERIC_CHAT_ENDPOINT_IDS as readonly string[]).includes(String(endpoint ?? ""));

const isChatCompletionsEndpoint = (endpoint: GenericEndpointId) =>
  endpoint === "/v1/chat/completions" || endpoint === "/paas/v4/chat/completions";

const isConversationsEndpoint = (endpoint: GenericEndpointId) => endpoint === "/v1/conversations";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const resolveGenericChatEndpointUrl = (baseUrl: string, endpoint: GenericEndpointId) => {
  const base = trimTrailingSlash(baseUrl || "");
  return `${base}${endpoint}`;
};

const numberFromUsageValue = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const getUsageNumber = (usage: any, keys: string[]) => {
  for (const key of keys) {
    const value = key.split(".").reduce<any>((acc, segment) => acc?.[segment], usage);
    const numberValue = numberFromUsageValue(value);
    if (numberValue !== undefined) return numberValue;
  }
  return undefined;
};

  const normalizeUsage = (usage: any) => {
    if (!usage || typeof usage !== "object") return undefined;

    const promptTokens = getUsageNumber(usage, [
      "promptTokens",
      "inputTokens",
      "prompt_tokens",
      "input_tokens",
      "total_input_tokens",
      "tokens.prompt",
      "tokens.input",
    ]);
    const completionTokens = getUsageNumber(usage, [
      "completionTokens",
      "outputTokens",
      "completion_tokens",
      "output_tokens",
      "total_output_tokens",
      "tokens.completion",
      "tokens.output",
    ]);
  const providedTotalTokens = getUsageNumber(usage, [
    "totalTokens",
    "total_tokens",
    "tokens.total",
  ]);
  const totalTokens = providedTotalTokens
    ?? (promptTokens !== undefined || completionTokens !== undefined
      ? (promptTokens ?? 0) + (completionTokens ?? 0)
      : undefined);

  return promptTokens !== undefined || completionTokens !== undefined || totalTokens !== undefined
    ? compactObject({ promptTokens, completionTokens, totalTokens })
    : undefined;
};

const getEndpointFromRequestInput = (input: RequestInfo | URL): GenericEndpointId | undefined => {
  const raw = typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input instanceof Request
        ? input.url
        : String(input);

  const path = (() => {
    try {
      return new URL(raw, globalThis.location?.origin ?? "http://localhost").pathname;
    } catch {
      return raw;
    }
  })();

  for (const endpoint of GENERIC_CHAT_ENDPOINT_IDS) {
    if (path.endsWith(endpoint)) return endpoint;
  }
  return undefined;
};

const extractTextFromValue = (value: any): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(extractTextFromValue).filter(Boolean).join("");
  if (!value || typeof value !== "object") return "";
  if (typeof value.text === "string") return value.text;
  if (typeof value.output_text === "string") return value.output_text;
  if (typeof value.content === "string") return value.content;
  return "";
};

const extractGenericStreamText = (endpoint: GenericEndpointId, event: any): string => {
  if (endpoint === "/v1/messages" && event?.type === "content_block_delta") {
    return extractTextFromValue(event?.delta?.text ?? event?.delta?.partial_json ?? event?.delta);
  }

  if (endpoint === "/v1/responses") {
    if (event?.type === "response.output_text.delta" && typeof event?.delta === "string") return event.delta;
    if (event?.type === "response.refusal.delta" && typeof event?.delta === "string") return event.delta;
    if (typeof event?.delta === "string") return event.delta;
    if (typeof event?.output_text === "string") return event.output_text;
    return extractTextFromValue(event?.content);
  }

  if (endpoint === "/v1/conversations") {
    if (typeof event?.delta === "string") return event.delta;
    if (typeof event?.text === "string") return event.text;
    if (typeof event?.output_text === "string") return event.output_text;
    return extractTextFromValue(event?.content ?? event?.message?.content ?? event?.output?.content);
  }

  return extractPlaygroundStreamText(endpoint, event);
};

const textToDataUrl = (text: string, mediaType: string) =>
  `data:${mediaType};charset=utf-8,${encodeURIComponent(text)}`;

const INTERACTIONS_PROVIDER_TOOL_TYPES = new Set([
  "function_call",
  "code_execution_call",
  "url_context_call",
  "mcp_server_tool_call",
  "google_search_call",
  "file_search_call",
  "google_maps_call",
  "function_result",
  "code_execution_result",
  "url_context_result",
  "mcp_server_tool_result",
  "google_search_result",
  "file_search_result",
  "google_maps_result",
]);

const INTERACTIONS_TOOL_RESULT_TYPES = new Set([
  "function_result",
  "code_execution_result",
  "url_context_result",
  "mcp_server_tool_result",
  "google_search_result",
  "file_search_result",
  "google_maps_result",
]);

const createUiMessageChunkStream = ({
  endpoint,
  providerKey,
  source,
  requestModel,
  providers,
}: {
  endpoint: GenericEndpointId;
  providerKey?: string;
  source: ReadableStream<Uint8Array>;
  requestModel?: string;
  providers?: Record<string, Provider>;
}): ReadableStream<Uint8Array> => {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const textPartId = "text-1";
  const messageId = `generic-${endpoint.replace(/[^a-z0-9]+/gi, "-")}-${Date.now()}`;
  let buffer = "";
  let startedMessage = false;
  let startedStep = false;
  let startedText = false;
  let endedText = false;
  let closed = false;
  let latestModel: string | undefined = requestModel;
  let latestUsage: any | undefined;
  let latestRawUsage: any | undefined;
  let latestGateway: any | undefined;
  let latestProviderStreamMetadata: Record<string, any> | undefined;
  let finalTextBuffer = "";
  const startedToolCalls = new Set<string>();
  const emittedToolOutputs = new Set<string>();
  const activeReasoningIds = new Set<string>();
  const closedReasoningIds = new Set<string>();
  const reasoningTextById = new Map<string, string>();
  const reasoningProviderMetadataById = new Map<string, Record<string, any>>();
  const interactionsStepsByIndex = new Map<number, any>();
  const emittedSourceKeys = new Set<string>();
  const imageGenerationItems = new Map<string, any>();
  const imageGenerationFinalFiles = new Set<string>();
  const messagesContentBlocksByIndex = new Map<number, any>();
  const messagesReasoningIdsByIndex = new Map<number, string>();

  const enqueueChunk = (controller: ReadableStreamDefaultController<Uint8Array>, chunk: any) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
  };

  const messageMetadata = () => ({
    model: latestModel,
    usage: latestUsage,
      providerMetadata: {
        gateway: latestGateway,
        ...(providerKey
          ? {
          [providerKey]: compactObject({
            ...(latestProviderStreamMetadata ?? {}),
            usage: latestRawUsage,
          }),
        }
        : {}),
      },
    timestamp: new Date().toISOString(),
  });

  const resolveProvider = () => {
    const resolvedProviderKey = normalizeProviderKey(providerKey) ?? providerKeyFromModel(latestModel ?? requestModel);
    return resolvedProviderKey ? providers?.[resolvedProviderKey] : undefined;
  };

  const resolveProviderKey = () => normalizeProviderKey(providerKey) ?? providerKeyFromModel(latestModel ?? requestModel);

  const createReasoningProviderMetadata = (item?: any) => {
    const resolvedProviderKey = resolveProviderKey();
    if (!resolvedProviderKey) return undefined;

    const providerEntry = compactObject({
      encrypted_content: typeof item?.encrypted_content === "string" && item.encrypted_content
        ? item.encrypted_content
        : undefined,
      signature: typeof item?.signature === "string" && item.signature
        ? item.signature
        : undefined,
      type: item?.type === ANTHROPIC_THINKING_METADATA_TYPES.thinking
        || item?.type === ANTHROPIC_THINKING_METADATA_TYPES.redactedThinking
        ? item.type
        : undefined,
      data: item?.type === ANTHROPIC_THINKING_METADATA_TYPES.redactedThinking
        && typeof item?.data === "string"
        && item.data
        ? item.data
        : undefined,
    });

    return Object.keys(providerEntry).length
      ? { [resolvedProviderKey]: providerEntry }
      : undefined;
  };

  const rememberReasoningMetadata = (id: string, item?: any) => {
    const providerMetadata = createReasoningProviderMetadata(item);
    if (!providerMetadata) return undefined;
    const currentProviderMetadata = reasoningProviderMetadataById.get(id) ?? {};
    const mergedProviderMetadata = { ...currentProviderMetadata };
    for (const [key, value] of Object.entries(providerMetadata)) {
      mergedProviderMetadata[key] = {
        ...(currentProviderMetadata[key] ?? {}),
        ...(value ?? {}),
      };
    }
    reasoningProviderMetadataById.set(id, mergedProviderMetadata);
    return mergedProviderMetadata;
  };

  const ensureMessageStarted = (controller: ReadableStreamDefaultController<Uint8Array>) => {
    if (startedMessage) return;
    enqueueChunk(controller, {
      type: "start",
      messageId,
      messageMetadata: messageMetadata(),
    });
    startedMessage = true;
  };

  const ensureStepStarted = (controller: ReadableStreamDefaultController<Uint8Array>) => {
    ensureMessageStarted(controller);
    if (startedStep) return;
    enqueueChunk(controller, { type: "start-step" });
    startedStep = true;
  };

  const ensureStarted = (controller: ReadableStreamDefaultController<Uint8Array>) => {
    if (startedText) return;
    ensureStepStarted(controller);
    enqueueChunk(controller, { type: "text-start", id: textPartId });
    startedText = true;
    endedText = false;
  };

  const closeText = (controller: ReadableStreamDefaultController<Uint8Array>) => {
    if (!startedText || endedText) return;
    enqueueChunk(controller, { type: "text-end", id: textPartId });
    endedText = true;
  };

  const closeReasoning = (controller: ReadableStreamDefaultController<Uint8Array>, id: string) => {
    if (!activeReasoningIds.has(id) || closedReasoningIds.has(id)) return;
    enqueueChunk(controller, { type: "reasoning-end", id, providerMetadata: reasoningProviderMetadataById.get(id) });
    activeReasoningIds.delete(id);
    closedReasoningIds.add(id);
  };

  const closeActiveReasoning = (controller: ReadableStreamDefaultController<Uint8Array>) => {
    for (const reasoningId of Array.from(activeReasoningIds)) {
      closeReasoning(controller, reasoningId);
    }
  };

  const finish = (controller: ReadableStreamDefaultController<Uint8Array>, finishReason = "stop") => {
    if (closed) return;
    if (endpoint === "/v1/responses") {
      ensureMessageStarted(controller);
      closeActiveReasoning(controller);
      closeText(controller);
      if (startedStep) enqueueChunk(controller, { type: "finish-step" });
    } else {
      closeActiveReasoning(controller);
      ensureStarted(controller);
      closeText(controller);
      enqueueChunk(controller, { type: "finish-step" });
    }
    enqueueChunk(controller, {
      type: "finish",
      finishReason,
      messageMetadata: messageMetadata(),
    });
    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
    closed = true;
  };

  const rememberMetadata = (event: any) => {
    if (!event || typeof event !== "object") return;
    latestModel = event.model ?? event.message?.model ?? event.response?.model ?? event.conversation?.model ?? event.interaction?.model ?? latestModel;
    const usage = event.usage
      ?? event.message?.usage
      ?? event.response?.usage
      ?? event.conversation?.usage
      ?? event.interaction?.usage
      ?? event.metadata?.total_usage;
    if (usage) {
      latestRawUsage = usage;
      latestUsage = normalizeUsage(usage) ?? latestUsage;
    }
    const responseGateway = event.metadata?.gateway ?? event.response?.metadata?.gateway;
    const currentGateway = responseGateway ?? latestGateway;
    const providerGateway = resolveProvider()?.createGatewayMetadata?.({
      event,
      endpoint,
      requestModel: latestModel ?? requestModel,
      directProviderEndpoint: Boolean(providerKey),
      currentGateway,
    });
    latestGateway = providerGateway ?? currentGateway;

    if (isConversationsEndpoint(endpoint)) {
      const conversationMetadata = compactObject({
        ...(latestProviderStreamMetadata ?? {}),
        conversation_id: event.conversation_id ?? event.conversation?.id ?? event.response?.conversation_id,
        response_id: event.id ?? event.response?.id,
        event_type: event.type,
        object: event.object,
      });
      latestProviderStreamMetadata = Object.keys(conversationMetadata).length ? conversationMetadata : latestProviderStreamMetadata;
    }
  };

  const safeJsonParse = (value: unknown) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (!trimmed) return {};
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  };

  const responsesToolName = (item: any) => {
    const type = String(item?.type ?? "");
    if (type === "web_search_call") return "web_search";
    if (type === "image_generation_call") return "image_generation";
    if (type === "function_call") return item?.name ?? "function_call";
    if (type.endsWith("_call")) return type.replace(/_call$/, "");
    return item?.name ?? type ?? "provider_tool";
  };

  const compactToolInput = (value: Record<string, any>) => Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null),
  );

  const responsesToolInput = (item: any) => {
    if (item?.type === "web_search_call") {
      return compactToolInput({
        action: item?.action?.type,
        query: item?.action?.query,
        queries: item?.action?.queries,
        sources: item?.action?.sources,
        status: item?.status,
      });
    }

    return safeJsonParse(item?.arguments ?? item?.input ?? item?.action ?? {});
  };

  const responsesToolOutput = (item: any) => {
    if (item?.type === "web_search_call") {
      return compactToolInput({
        status: item?.status,
        action: item?.action,
        results: item?.results,
      });
    }

    return item?.output ?? item?.result ?? item;
  };

  const isImageGenerationItemType = (type: unknown) => {
    const normalizedType = String(type ?? "");
    return normalizedType === "image_generation_call" || normalizedType.endsWith(":image_generation");
  };

  const imageMediaTypeFromFormat = (format?: string) => {
    const normalizedFormat = String(format ?? "").trim().toLowerCase();
    if (!normalizedFormat) return "image/png";
    if (normalizedFormat.includes("/")) return normalizedFormat;
    return `image/${normalizedFormat.replace(/^\.+/, "") || "png"}`;
  };

  const stripDataUrlBase64 = (value?: string) => {
    const base64 = String(value ?? "").trim();
    if (!base64) return "";
    if (!base64.startsWith("data:")) return base64;

    const commaIndex = base64.indexOf(",");
    return commaIndex >= 0 ? base64.slice(commaIndex + 1).trim() : "";
  };

  const toImageDataUrl = (base64: string, mediaType: string) => {
    const payload = stripDataUrlBase64(base64);
    if (!payload) return undefined;
    return `data:${mediaType};base64,${payload}`;
  };

  const rememberImageGenerationItem = (item?: any) => {
    const itemId = item?.id ?? item?.item_id;
    if (!itemId) return undefined;
    const previous = imageGenerationItems.get(itemId) ?? {};
    const next = compactObject({ ...previous, ...(item ?? {}) });
    imageGenerationItems.set(itemId, next);
    return next;
  };

  const getImageGenerationItem = (itemId?: string, fallback?: any) => {
    if (!itemId) return fallback;
    return imageGenerationItems.get(itemId) ?? fallback;
  };

  const imageGenerationFileId = (itemId: string) => `generated-image-${itemId}`;

  const imageGenerationMetadata = ({
    item,
    event,
    mediaType,
    partial,
    revision,
  }: {
    item?: any;
    event?: any;
    mediaType: string;
    partial: boolean;
    revision?: number;
  }) => {
    const resolvedProviderKey = resolveProviderKey() ?? "openai";
    const itemId = String(event?.item_id ?? item?.id ?? "image_generation");
    return {
      [resolvedProviderKey]: compactObject({
        item_id: itemId,
        id: itemId,
        generated_image_id: imageGenerationFileId(itemId),
        source: "response.image_generation_call",
        partial,
        revision,
        status: event?.type?.replace("response.image_generation_call.", "") ?? item?.status,
        output_index: event?.output_index ?? item?.output_index,
        output_format: event?.output_format ?? item?.output_format,
        media_type: mediaType,
        background: event?.background ?? item?.background,
        quality: item?.quality,
        action: item?.action,
        size: item?.size,
        revised_prompt: item?.revised_prompt,
      }),
    };
  };

  const emitImageGenerationToolInput = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    itemOrEvent: any,
    status?: string,
  ) => {
    const toolCallId = itemOrEvent?.id ?? itemOrEvent?.item_id;
    if (!toolCallId) return;

    ensureStepStarted(controller);
    if (!startedToolCalls.has(toolCallId)) {
      enqueueChunk(controller, {
        type: "tool-input-start",
        toolCallId,
        toolName: "image_generation",
        providerExecuted: true,
        title: "Image generation",
      });
      startedToolCalls.add(toolCallId);
    }

    const item = getImageGenerationItem(toolCallId, itemOrEvent);
    enqueueChunk(controller, {
      type: "tool-input-available",
      toolCallId,
      toolName: "image_generation",
      input: compactToolInput({
        status: status ?? item?.status,
        action: item?.action,
        background: item?.background ?? itemOrEvent?.background,
        output_format: item?.output_format ?? itemOrEvent?.output_format,
        quality: item?.quality,
        size: item?.size,
      }),
      providerExecuted: true,
      title: "Image generation",
    });
  };

  const emitImageGenerationFile = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    itemOrEvent: any,
    base64: string | undefined,
    partial: boolean,
  ) => {
    const itemId = itemOrEvent?.item_id ?? itemOrEvent?.id;
    if (!itemId) return false;

    const item = getImageGenerationItem(itemId, itemOrEvent);
    const outputFormat = itemOrEvent?.output_format ?? item?.output_format;
    const mediaType = imageMediaTypeFromFormat(outputFormat);
    const url = toImageDataUrl(base64 ?? "", mediaType);
    if (!url) return false;
    const revision = partial
      ? (Number(item?.partial_revision ?? 0) || 0) + 1
      : undefined;
    if (partial) {
      imageGenerationItems.set(String(itemId), compactObject({ ...item, partial_revision: revision }));
    }

    ensureStepStarted(controller);
    enqueueChunk(controller, {
      type: "file",
      url,
      mediaType,
      providerMetadata: imageGenerationMetadata({ item, event: itemOrEvent, mediaType, partial, revision }),
    });
    return true;
  };

  const emitImageGenerationToolOutput = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    item: any,
    preliminary: boolean,
  ) => {
    const toolCallId = item?.id ?? item?.item_id;
    if (!toolCallId) return;
    const outputFormat = item?.output_format;
    const mediaType = imageMediaTypeFromFormat(outputFormat);
    enqueueChunk(controller, {
      type: "tool-output-available",
      toolCallId,
      output: compactToolInput({
        status: item?.status,
        action: item?.action,
        background: item?.background,
        output_format: outputFormat,
        media_type: mediaType,
        quality: item?.quality,
        size: item?.size,
        revised_prompt: item?.revised_prompt,
      }),
      providerExecuted: true,
      preliminary,
      providerMetadata: imageGenerationMetadata({ item, mediaType, partial: preliminary }),
    });
  };

  const handleImageGenerationPayload = (
    event: any,
    controller: ReadableStreamDefaultController<Uint8Array>,
  ) => {
    const type = event?.type;

    if (type === "response.output_item.added" && isImageGenerationItemType(event?.item?.type)) {
      const item = rememberImageGenerationItem({ ...event.item, output_index: event.output_index });
      emitImageGenerationToolInput(controller, item, "in_progress");
      return true;
    }

    if (type?.startsWith("response.image_generation_call.") && typeof event?.item_id === "string") {
      const eventStatus = type.replace("response.image_generation_call.", "");
      const item = rememberImageGenerationItem(compactObject({
        ...(getImageGenerationItem(event.item_id) ?? {}),
        id: event.item_id,
        output_index: event.output_index,
        output_format: event.output_format,
        background: event.background,
        status: eventStatus,
      }));

      emitImageGenerationToolInput(controller, item ?? event, eventStatus);

      if (type === "response.image_generation_call.partial_image") {
        emitImageGenerationFile(controller, event, event.partial_image_b64, true);
      }

      return true;
    }

    if (type === "response.output_item.done" && isImageGenerationItemType(event?.item?.type)) {
      const item = rememberImageGenerationItem({ ...event.item, output_index: event.output_index });
      emitImageGenerationToolInput(controller, item, item?.status ?? "completed");
      if (!emittedToolOutputs.has(item?.id)) {
        emitImageGenerationToolOutput(controller, item, false);
        emittedToolOutputs.add(item?.id);
      }

      if (item?.id && !imageGenerationFinalFiles.has(item.id)) {
        emitImageGenerationFile(controller, item, item?.result, false);
        imageGenerationFinalFiles.add(item.id);
      }

      return true;
    }

    return false;
  };

  const emitProviderTool = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    item: any,
    includeOutput: boolean,
  ) => {
    const toolCallId = item?.id ?? item?.call_id;
    if (!toolCallId) return;

    const toolName = responsesToolName(item);
    ensureStepStarted(controller);

    if (!startedToolCalls.has(toolCallId)) {
      enqueueChunk(controller, {
        type: "tool-input-start",
        toolCallId,
        toolName,
        providerExecuted: true,
        title: item?.type === "web_search_call" ? "Web search" : item?.name,
      });
      startedToolCalls.add(toolCallId);
    }

    enqueueChunk(controller, {
      type: "tool-input-available",
      toolCallId,
      toolName,
      input: responsesToolInput(item),
      providerExecuted: true,
      title: item?.type === "web_search_call" ? "Web search" : item?.name,
    });

    if (includeOutput && !emittedToolOutputs.has(toolCallId)) {
      enqueueChunk(controller, {
        type: "tool-output-available",
        toolCallId,
        output: responsesToolOutput(item),
        providerExecuted: true,
      });
      emittedToolOutputs.add(toolCallId);
    }
  };

  const zaiAgentProviderMetadata = (event: any, extra?: Record<string, any>) => ({
    zai: compactObject({
      agent: true,
      agent_id: event?.agent_id,
      id: event?.id,
      async_id: event?.async_id,
      conversation_id: event?.conversation_id,
      status: event?.status,
      raw: event,
      ...(extra ?? {}),
    }),
  });

  const emitZaiAgentText = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    event: any,
    text?: string,
    phase?: string,
  ) => {
    const delta = String(text ?? "");
    if (!delta) return false;

    if (phase === "thinking") {
      emitReasoningDelta(controller, `reasoning-zai-agent-${event?.id ?? "stream"}`, delta);
      return true;
    }

    closeActiveReasoning(controller);
    ensureStarted(controller);
    finalTextBuffer += delta;
    enqueueChunk(controller, {
      type: "text-delta",
      id: textPartId,
      delta,
      providerMetadata: zaiAgentProviderMetadata(event, { phase }),
    });
    return true;
  };

  const emitZaiAgentToolObject = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    event: any,
    objectPart: any,
    index: number,
    phase?: string,
  ) => {
    const obj = objectPart?.object && typeof objectPart.object === "object" ? objectPart.object : objectPart;
    const toolName = obj?.tool_name ?? objectPart?.tool_name ?? "zai_agent_tool";
    const toolCallId = obj?.id ?? `${event?.id ?? event?.async_id ?? "zai-agent"}-${toolName}-${index}`;
    const title = objectPart?.title ?? objectPart?.tag_en ?? objectPart?.tag_cn ?? toolName;

    ensureStepStarted(controller);
    if (!startedToolCalls.has(toolCallId)) {
      enqueueChunk(controller, {
        type: "tool-input-start",
        toolCallId,
        toolName,
        providerExecuted: true,
        title,
      });
      startedToolCalls.add(toolCallId);
    }

    enqueueChunk(controller, {
      type: "tool-input-available",
      toolCallId,
      toolName,
      input: safeJsonParse(obj?.input ?? {}),
      providerExecuted: true,
      title,
      providerMetadata: zaiAgentProviderMetadata(event, { phase, tool_name: toolName, tool_title: title }),
    });

    if (!emittedToolOutputs.has(toolCallId)) {
      const output = safeJsonParse(obj?.output ?? obj?.result ?? obj ?? {});
      enqueueChunk(controller, {
        type: "tool-output-available",
        toolCallId,
        output,
        providerExecuted: true,
        providerMetadata: zaiAgentProviderMetadata(event, { phase, tool_name: toolName, tool_title: title }),
      });
      emittedToolOutputs.add(toolCallId);

      if (typeof obj?.output === "string" && /<html[\s>]|<!doctype html/i.test(obj.output)) {
        enqueueChunk(controller, {
          type: "file",
          url: textToDataUrl(obj.output, "text/html"),
          mediaType: "text/html",
          filename: `${String(title || toolName).replace(/[^a-z0-9._-]+/gi, "-") || "zai-slide"}.html`,
          providerMetadata: zaiAgentProviderMetadata(event, { phase, tool_name: toolName, tool_title: title }),
        });
      }
    }
  };

  const handleZaiAgentMessage = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    event: any,
    message: any,
    index: number,
  ) => {
    const messages = Array.isArray(message) ? message : [message];
    let emitted = false;

    messages.forEach((entry, entryIndex) => {
      const phase = entry?.phase;
      const content = entry?.content;
      if (typeof content === "string") {
        emitted = emitZaiAgentText(controller, event, content, phase) || emitted;
        return;
      }

      if (content?.text) {
        emitted = emitZaiAgentText(controller, event, content.text, phase) || emitted;
        return;
      }

      const parts = Array.isArray(content) ? content : content ? [content] : [];
      parts.forEach((part, partIndex) => {
        if (typeof part?.text === "string") {
          emitted = emitZaiAgentText(controller, event, part.text, phase) || emitted;
        } else if (part?.type === "object" || part?.object) {
          emitZaiAgentToolObject(controller, event, part, index * 1000 + entryIndex * 100 + partIndex, phase);
          emitted = true;
        }
      });
    });

    return emitted;
  };

  const handleZaiAgentsPayload = (event: any, controller: ReadableStreamDefaultController<Uint8Array>) => {
    if (event?.error) {
      enqueueChunk(controller, { type: "error", errorText: event.error?.message ?? "Z.AI agent request failed." });
      return;
    }

    if (event?.status || event?.async_id) {
      emitZaiAgentText(
        controller,
        event,
        [`Z.AI agent status: ${event.status ?? "created"}.`, event.async_id ? `Async ID: ${event.async_id}.` : ""].filter(Boolean).join(" "),
      );
    }

    let emitted = false;
    for (const [choiceIndex, choice] of (event?.choices ?? []).entries()) {
      const message = choice?.messages ?? choice?.message ?? choice?.delta;
      if (message) emitted = handleZaiAgentMessage(controller, event, message, choiceIndex) || emitted;
      if (choice?.finish_reason) {
        rememberMetadata(event);
        if (!emitted && !startedText) ensureMessageStarted(controller);
        finish(controller, choice.finish_reason);
      }
    }

    if (!emitted && event?.agent_id && !event?.choices?.length) {
      emitZaiAgentText(controller, event, extractTextFromValue(event));
    }
  };

  const emitSource = (controller: ReadableStreamDefaultController<Uint8Array>, annotation: any, fallbackIndex?: number) => {
    if (annotation?.type !== "url_citation" || typeof annotation?.url !== "string") return;
    const sourceId = `response-source-${fallbackIndex ?? emittedSourceKeys.size}`;
    const key = `${annotation.url}|${annotation.title ?? ""}`;
    if (emittedSourceKeys.has(key)) return;
    emittedSourceKeys.add(key);
    ensureStepStarted(controller);
    enqueueChunk(controller, {
      type: "source-url",
      sourceId,
      url: annotation.url,
      title: annotation.title,
      providerMetadata: {
        openai: {
          start_index: annotation.start_index,
          end_index: annotation.end_index,
        },
      },
    });
  };

  const responseReasoningId = (event: any) => `reasoning-${event?.item_id ?? "summary"}-${event?.content_index ?? event?.summary_index ?? 0}`;

  const providerMetadataFor = (entry: Record<string, any>, fallbackProviderKey?: string) => {
    const resolvedProviderKey = resolveProviderKey() ?? fallbackProviderKey;
    return resolvedProviderKey ? { [resolvedProviderKey]: compactObject(entry) } : undefined;
  };

  const ensureReasoning = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    id: string,
    providerMetadata?: Record<string, any>,
  ) => {
    ensureStepStarted(controller);
    const rememberedProviderMetadata = providerMetadata ?? reasoningProviderMetadataById.get(id);
    if (rememberedProviderMetadata) reasoningProviderMetadataById.set(id, rememberedProviderMetadata);
    if (!activeReasoningIds.has(id) && !closedReasoningIds.has(id)) {
      enqueueChunk(controller, { type: "reasoning-start", id, providerMetadata: rememberedProviderMetadata });
      activeReasoningIds.add(id);
    }
  };

  const emitReasoningDelta = (controller: ReadableStreamDefaultController<Uint8Array>, id: string, delta: string) => {
    if (!delta) return;
    ensureReasoning(controller, id);
    reasoningTextById.set(id, `${reasoningTextById.get(id) ?? ""}${delta}`);
    enqueueChunk(controller, { type: "reasoning-delta", id, delta, providerMetadata: reasoningProviderMetadataById.get(id) });
  };

  const rememberInteractionsStep = (index: number | undefined, patch?: any) => {
    if (typeof index !== "number") return patch;
    const next = compactObject({
      ...(interactionsStepsByIndex.get(index) ?? {}),
      ...(patch ?? {}),
    });
    interactionsStepsByIndex.set(index, next);
    return next;
  };

  const interactionsStepId = (index?: number, prefix = "interactions") => `${prefix}-${typeof index === "number" ? index : interactionsStepsByIndex.size}`;

  const interactionsToolName = (step: any) => {
    const type = String(step?.type ?? "");
    if (type === "mcp_server_tool_call" || type === "mcp_server_tool_result") return step?.name ?? step?.server_name ?? "mcp_server";
    if (type === "function_call" || type === "function_result") return step?.name ?? "function_call";
    if (type === "code_execution_call" || type === "code_execution_result") return "code_execution";
    if (type === "url_context_call" || type === "url_context_result") return "url_context";
    if (type === "google_search_call" || type === "google_search_result") return "google_search";
    if (type === "file_search_call" || type === "file_search_result") return "file_search";
    if (type === "google_maps_call" || type === "google_maps_result") return "google_maps";
    return type.replace(/_(call|result)$/, "") || "provider_tool";
  };

  const interactionsToolInput = (step: any) => safeJsonParse(step?.arguments ?? step?.input ?? {});

  const interactionsToolOutput = (step: any) => step?.result ?? step?.output ?? step;

  const interactionsContentText = (content: any) => {
    if (content?.type === "thought_summary") return extractTextFromValue(content?.content ?? content?.summary ?? content?.text);
    return extractTextFromValue(content);
  };

  const emitInteractionsContent = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    content: any,
    index?: number,
    partial = false,
  ) => {
    const type = String(content?.type ?? "text");
    if (type === "text" || type === "output_text" || typeof content === "string") {
      const delta = interactionsContentText(content);
      if (!delta) return false;
      closeActiveReasoning(controller);
      ensureStarted(controller);
      finalTextBuffer += delta;
      enqueueChunk(controller, {
        type: "text-delta",
        id: textPartId,
        delta,
        providerMetadata: providerMetadataFor({
          source: "interactions.step.delta",
          index,
          content_type: type,
          partial,
          annotations: content?.annotations,
        }),
      });
      return true;
    }

    if (type === "thought_summary") {
      const delta = interactionsContentText(content);
      if (!delta) return false;
      emitReasoningDelta(controller, interactionsStepId(index, "reasoning-interactions"), delta);
      return true;
    }

    if (["image", "audio", "video", "document"].includes(type)) {
      const data = content?.data;
      const uri = content?.uri;
      const mimeType = content?.mime_type ?? (type === "image" ? "image/png" : "application/octet-stream");
      const url = typeof uri === "string" && uri
        ? uri
        : typeof data === "string" && data
          ? (data.startsWith("data:") ? data : `data:${mimeType};base64,${stripDataUrlBase64(data)}`)
          : undefined;
      if (!url) return false;

      ensureStepStarted(controller);
      enqueueChunk(controller, {
        type: "file",
        url,
        mediaType: mimeType,
        providerMetadata: providerMetadataFor({
          source: "interactions.step.delta",
          index,
          content_type: type,
          partial,
          resolution: content?.resolution,
          sample_rate: content?.sample_rate,
          channels: content?.channels,
        }),
      });
      return true;
    }

    return false;
  };

  const emitInteractionsTool = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    step: any,
    index?: number,
    includeOutput?: boolean,
  ) => {
    const toolCallId = step?.id ?? step?.call_id ?? interactionsStepId(index, "interactions-tool");
    const toolName = interactionsToolName(step);
    ensureStepStarted(controller);

    if (!startedToolCalls.has(toolCallId)) {
      enqueueChunk(controller, {
        type: "tool-input-start",
        toolCallId,
        toolName,
        providerExecuted: true,
        title: toolName,
      });
      startedToolCalls.add(toolCallId);
    }

    enqueueChunk(controller, {
      type: "tool-input-available",
      toolCallId,
      toolName,
      input: interactionsToolInput(step),
      providerExecuted: true,
      title: toolName,
      providerMetadata: providerMetadataFor({
        source: "interactions.step",
        index,
        step_type: step?.type,
        signature: step?.signature,
        server_name: step?.server_name,
      }),
    });

    if (includeOutput && !emittedToolOutputs.has(toolCallId)) {
      enqueueChunk(controller, {
        type: "tool-output-available",
        toolCallId,
        output: interactionsToolOutput(step),
        providerExecuted: true,
        providerMetadata: providerMetadataFor({
          source: "interactions.step",
          index,
          step_type: step?.type,
          signature: step?.signature,
          is_error: step?.is_error,
        }),
      });
      emittedToolOutputs.add(toolCallId);
    }
  };

  const emitInteractionsStepSnapshot = (controller: ReadableStreamDefaultController<Uint8Array>, step: any, index?: number) => {
    const stepType = String(step?.type ?? "");
    if (stepType === "model_output") {
      return (step?.content ?? []).some((content: any) => emitInteractionsContent(controller, content, index, false));
    }

    if (stepType === "thought") {
      const summary = step?.summary ?? step?.content;
      const id = interactionsStepId(index, "reasoning-interactions");
      if (typeof step?.signature === "string" && step.signature) {
        rememberReasoningMetadata(id, { signature: step.signature });
      }
      const emitted = (Array.isArray(summary) ? summary : [summary])
        .filter(Boolean)
        .some((content: any) => {
          const text = extractTextFromValue(content);
          if (!text) return false;
          emitReasoningDelta(controller, id, text);
          return true;
        });
      closeReasoning(controller, id);
      return emitted;
    }

    if (INTERACTIONS_PROVIDER_TOOL_TYPES.has(stepType)) {
      emitInteractionsTool(controller, step, index, INTERACTIONS_TOOL_RESULT_TYPES.has(stepType));
      return true;
    }

    return false;
  };

  const handleInteractionsPayload = (event: any, controller: ReadableStreamDefaultController<Uint8Array>, eventName?: string) => {
    const type = eventName ?? event?.event_type ?? event?.type;

    if (type === "interaction.created" || type === "interaction.status_update") {
      ensureMessageStarted(controller);
      if (event?.interaction) rememberMetadata(event);
      return;
    }

    if (type === "error") {
      enqueueChunk(controller, { type: "error", errorText: event?.error?.message ?? "Interactions request failed." });
      return;
    }

    if (type === "step.start") {
      const step = rememberInteractionsStep(event?.index, event?.step);
      if (step?.type === "thought") {
        ensureReasoning(controller, interactionsStepId(event?.index, "reasoning-interactions"));
      } else if (INTERACTIONS_PROVIDER_TOOL_TYPES.has(String(step?.type ?? ""))) {
        emitInteractionsTool(controller, step, event?.index, INTERACTIONS_TOOL_RESULT_TYPES.has(String(step?.type ?? "")));
      } else {
        ensureStepStarted(controller);
      }
      return;
    }

    if (type === "step.delta") {
      const currentStep = rememberInteractionsStep(event?.index);
      const delta = event?.delta;
      const deltaType = String(delta?.type ?? "");

      if (deltaType === "thought_signature") {
        const id = interactionsStepId(event?.index, "reasoning-interactions");
        rememberReasoningMetadata(id, { signature: delta?.signature });
        ensureReasoning(controller, id, reasoningProviderMetadataById.get(id));
        return;
      }

      if (deltaType === "thought_summary") {
        emitInteractionsContent(controller, delta, event?.index, true);
        return;
      }

      if (deltaType === "arguments_delta") {
        const toolCallId = currentStep?.id ?? interactionsStepId(event?.index, "interactions-tool");
        emitToolInput(controller, toolCallId, interactionsToolName(currentStep), delta?.arguments);
        return;
      }

      if (INTERACTIONS_PROVIDER_TOOL_TYPES.has(deltaType)) {
        emitInteractionsTool(controller, { ...currentStep, ...delta }, event?.index, INTERACTIONS_TOOL_RESULT_TYPES.has(deltaType));
        return;
      }

      emitInteractionsContent(controller, delta, event?.index, true);
      return;
    }

    if (type === "step.stop") {
      const currentStep = rememberInteractionsStep(event?.index);
      if (currentStep?.type === "thought") closeReasoning(controller, interactionsStepId(event?.index, "reasoning-interactions"));
      return;
    }

    if (type === "interaction.completed") {
      rememberMetadata(event);
      for (const [index, step] of event?.interaction?.steps?.entries?.() ?? []) {
        emitInteractionsStepSnapshot(controller, step, index);
      }
      finish(controller);
      return;
    }

    if (event?.object === "interaction" || Array.isArray(event?.steps)) {
      rememberMetadata({ interaction: event, ...event });
      for (const [index, step] of event?.steps?.entries?.() ?? []) {
        emitInteractionsStepSnapshot(controller, step, index);
      }
      if (event?.status === "completed" || event?.status === "incomplete" || event?.status === "cancelled" || event?.status === "failed") {
        finish(controller, event.status === "completed" ? "stop" : event.status);
      }
    }
  };

  const messagesReasoningId = (index: number) => `reasoning-messages-${index}`;

  const isMessagesReasoningBlock = (block: any) =>
    block?.type === ANTHROPIC_THINKING_METADATA_TYPES.thinking
    || block?.type === ANTHROPIC_THINKING_METADATA_TYPES.redactedThinking;

  const rememberMessagesReasoningMetadata = (index: number, patch?: any) => {
    const block = {
      ...(messagesContentBlocksByIndex.get(index) ?? {}),
      ...(patch ?? {}),
    };
    messagesContentBlocksByIndex.set(index, block);
    if (!isMessagesReasoningBlock(block)) return undefined;

    const id = messagesReasoningIdsByIndex.get(index) ?? messagesReasoningId(index);
    messagesReasoningIdsByIndex.set(index, id);
    return rememberReasoningMetadata(id, block);
  };

  const ensureMessagesReasoning = (controller: ReadableStreamDefaultController<Uint8Array>, index: number) => {
    const id = messagesReasoningIdsByIndex.get(index) ?? messagesReasoningId(index);
    messagesReasoningIdsByIndex.set(index, id);
    ensureReasoning(controller, id, rememberMessagesReasoningMetadata(index));
    return id;
  };

  const handleMessagesReasoningPayload = (event: any, controller: ReadableStreamDefaultController<Uint8Array>, eventName?: string) => {
    if (endpoint !== "/v1/messages") return false;

    const type = eventName ?? event?.type;
    const index = typeof event?.index === "number" ? event.index : undefined;

    if (type === "content_block_start" && index !== undefined) {
      const contentBlock = event?.content_block;
      if (!contentBlock || !isMessagesReasoningBlock(contentBlock)) return false;

      messagesContentBlocksByIndex.set(index, { ...contentBlock });
      const id = ensureMessagesReasoning(controller, index);
      const initialThinking = typeof contentBlock.thinking === "string" ? contentBlock.thinking : "";
      if (initialThinking) emitReasoningDelta(controller, id, initialThinking);
      return true;
    }

    if (type === "content_block_delta" && index !== undefined) {
      const block = messagesContentBlocksByIndex.get(index);
      if (!isMessagesReasoningBlock(block)) return false;

      const id = ensureMessagesReasoning(controller, index);
      const delta = event?.delta;
      if (delta?.type === "thinking_delta" && typeof delta.thinking === "string") {
        emitReasoningDelta(controller, id, delta.thinking);
        return true;
      }

      if (delta?.type === "signature_delta" && typeof delta.signature === "string") {
        rememberMessagesReasoningMetadata(index, {
          signature: `${block?.signature ?? ""}${delta.signature}`,
        });
        return true;
      }

      return false;
    }

    if (type === "content_block_stop" && index !== undefined) {
      const block = messagesContentBlocksByIndex.get(index);
      if (!isMessagesReasoningBlock(block)) return false;

      const id = ensureMessagesReasoning(controller, index);
      rememberMessagesReasoningMetadata(index);
      closeReasoning(controller, id);
      return true;
    }

    return false;
  };

  const emitResponsesTextSnapshot = (controller: ReadableStreamDefaultController<Uint8Array>, value: any) => {
    const text = extractTextFromValue(value);
    if (!text) return false;

    if (!finalTextBuffer) {
      ensureStarted(controller);
      finalTextBuffer = text;
      enqueueChunk(controller, { type: "text-delta", id: textPartId, delta: text });
      return true;
    }

    if (text.startsWith(finalTextBuffer)) {
      const delta = text.slice(finalTextBuffer.length);
      if (!delta) return false;
      ensureStarted(controller);
      finalTextBuffer = text;
      enqueueChunk(controller, { type: "text-delta", id: textPartId, delta });
      return true;
    }

    return false;
  };

  const applyProviderResponseOverride = (event: any, eventName?: string) => {
    const resolvedProviderKey = resolveProviderKey();
    const override = resolvedProviderKey ? RESPONSE_PROVIDER_STREAM_OVERRIDES[resolvedProviderKey] : undefined;
    return override?.({ event, eventName, endpoint, requestModel: latestModel ?? requestModel }) === true;
  };

  const handleResponsesPayload = (event: any, controller: ReadableStreamDefaultController<Uint8Array>, eventName?: string) => {
    if (applyProviderResponseOverride(event, eventName)) return;

    const type = event?.type;

    if (type === "response.created" || type === "response.in_progress") {
      ensureMessageStarted(controller);
      return;
    }

    if (type === "response.reasoning_summary_text.delta" && typeof event?.delta === "string") {
      const id = responseReasoningId(event);
      emitReasoningDelta(controller, id, event.delta);
      return;
    }

    if (type === "response.reasoning_text.delta" && typeof event?.delta === "string") {
      const id = responseReasoningId(event);
      emitReasoningDelta(controller, id, event.delta);
      return;
    }

    if (type === "response.reasoning_summary_text.done" || type === "response.reasoning_text.done") {
      const id = responseReasoningId(event);
      const finalText = typeof event?.text === "string" ? event.text : "";
      if (finalText && !activeReasoningIds.has(id) && !closedReasoningIds.has(id)) {
        emitReasoningDelta(controller, id, finalText);
      }
      return;
    }

    if (type === "response.reasoning_summary_part.done") {
      return;
    }

    if (type === "response.output_item.added" && event?.item?.type === "reasoning") {
      const id = responseReasoningId({ item_id: event.item.id, content_index: 0 });
      ensureReasoning(controller, id, rememberReasoningMetadata(id, event.item));
      return;
    }

    if (type === "response.output_item.done" && event?.item?.type === "reasoning") {
      for (const reasoningId of Array.from(activeReasoningIds).filter((id) => id.startsWith(`reasoning-${event.item.id}-`))) {
        rememberReasoningMetadata(reasoningId, event.item);
        closeReasoning(controller, reasoningId);
      }
      return;
    }

    if (type === "response.output_item.done" && event?.item?.type === "message") {
      emitResponsesTextSnapshot(controller, event.item?.content);
      return;
    }

    if (type === "response.content_part.added" && event?.part?.type === "reasoning_text") {
      const id = responseReasoningId(event);
      ensureReasoning(controller, id);
      if (typeof event?.part?.text === "string" && event.part.text) {
        emitReasoningDelta(controller, id, event.part.text);
      }
      return;
    }

    if (handleImageGenerationPayload(event, controller)) {
      return;
    }

    if (type === "response.output_item.added" && event?.item?.type && event.item.type !== "message" && event.item.type !== "reasoning") {
      emitProviderTool(controller, event.item, false);
      return;
    }

    if (type === "response.output_item.done" && event?.item?.type && event.item.type !== "message" && event.item.type !== "reasoning") {
      emitProviderTool(controller, event.item, true);
      return;
    }

    if (type?.startsWith("response.web_search_call.") && typeof event?.item_id === "string") {
      ensureStepStarted(controller);
      if (!startedToolCalls.has(event.item_id)) {
        enqueueChunk(controller, {
          type: "tool-input-start",
          toolCallId: event.item_id,
          toolName: "web_search",
          providerExecuted: true,
          title: "Web search",
        });
        startedToolCalls.add(event.item_id);
      }
      if (type === "response.web_search_call.in_progress" || type === "response.web_search_call.searching") {
        enqueueChunk(controller, {
          type: "tool-input-available",
          toolCallId: event.item_id,
          toolName: "web_search",
          input: { status: type.replace("response.web_search_call.", "") },
          providerExecuted: true,
          title: "Web search",
        });
      }
      return;
    }

    if (type === "response.output_text.delta" && typeof event?.delta === "string") {
      ensureStarted(controller);
      finalTextBuffer += event.delta;
      enqueueChunk(controller, { type: "text-delta", id: textPartId, delta: event.delta });
      return;
    }

    if (type === "response.output_text.annotation.added") {
      emitSource(controller, event.annotation, event.annotation_index);
      return;
    }

    if (type === "response.output_text.done") {
      if (!finalTextBuffer && typeof event?.text === "string" && event.text) {
        ensureStarted(controller);
        finalTextBuffer = event.text;
        enqueueChunk(controller, { type: "text-delta", id: textPartId, delta: event.text });
      }
      return;
    }

    if (type === "response.content_part.done") {
      if (event?.part?.type === "output_text" || event?.part?.type === "refusal") {
        emitResponsesTextSnapshot(controller, event.part);
      }
      (event?.part?.annotations ?? []).forEach((annotation: any, index: number) => emitSource(controller, annotation, index));
      return;
    }

    if (type === "response.completed") {
      rememberMetadata(event);
      emitResponsesTextSnapshot(controller, event?.response?.output);
      finish(controller);
    }
  };

  const conversationContentParts = (content: any): any[] => Array.isArray(content)
    ? content
    : content
      ? [content]
      : [];

  const conversationOutputItems = (event: any): any[] => {
    const outputs = event?.outputs ?? event?.response?.outputs ?? event?.conversation?.outputs;
    if (Array.isArray(outputs)) return outputs;
    const output = event?.output ?? event?.message ?? event?.response?.output;
    return output ? (Array.isArray(output) ? output : [output]) : [];
  };

  const conversationTextFromParts = (content: any) => conversationContentParts(content)
    .map((part) => extractTextFromValue(part?.text ?? part?.output_text ?? part?.content ?? part))
    .filter(Boolean)
    .join("");

  const conversationTextSnapshot = (event: any) => conversationOutputItems(event)
    .flatMap((item) => conversationContentParts(item?.content ?? item))
    .map((part) => extractTextFromValue(part?.text ?? part?.output_text ?? part?.content ?? part))
    .filter(Boolean)
    .join("");

  const emitConversationSourcePart = (controller: ReadableStreamDefaultController<Uint8Array>, part: any, fallbackIndex: number) => {
    const url = part?.url ?? part?.document_url ?? part?.source_url;
    if (typeof url !== "string" || !url) return;
    const key = `${url}|${part?.title ?? part?.document_name ?? ""}`;
    if (emittedSourceKeys.has(key)) return;
    emittedSourceKeys.add(key);
    ensureStepStarted(controller);
    enqueueChunk(controller, {
      type: "source-url",
      sourceId: `conversation-source-${fallbackIndex}`,
      url,
      title: part?.title ?? part?.document_name,
      providerMetadata: providerMetadataFor({ raw: part }, "mistral"),
    });
  };

  const emitConversationFilePart = (controller: ReadableStreamDefaultController<Uint8Array>, part: any, fallbackIndex: number) => {
    const fileId = part?.file_id ?? part?.id;
    if (typeof fileId !== "string" || !fileId) return;
    const url = `https://api.mistral.ai/v1/files/${encodeURIComponent(fileId)}`;
    const key = `${url}|${part?.file_name ?? part?.filename ?? ""}`;
    if (emittedSourceKeys.has(key)) return;
    emittedSourceKeys.add(key);
    ensureStepStarted(controller);
    enqueueChunk(controller, {
      type: "source-url",
      sourceId: `conversation-file-${fallbackIndex}`,
      url,
      title: part?.file_name ?? part?.filename ?? fileId,
      providerMetadata: providerMetadataFor({ file_id: fileId, file_type: part?.file_type, raw: part }, "mistral"),
    });
  };

  const emitConversationArtifacts = (controller: ReadableStreamDefaultController<Uint8Array>, content: any) => {
    conversationContentParts(content).forEach((part, index) => {
      const type = String(part?.type ?? "");
      if (type === "tool_reference" || type === "document_url") emitConversationSourcePart(controller, part, index);
      if (type === "tool_file") emitConversationFilePart(controller, part, index);
    });
  };

  const emitConversationText = (controller: ReadableStreamDefaultController<Uint8Array>, text: string) => {
    if (!text) return false;
    closeActiveReasoning(controller);
    ensureStarted(controller);
    finalTextBuffer += text;
    enqueueChunk(controller, { type: "text-delta", id: textPartId, delta: text });
    return true;
  };

  const emitConversationTextSnapshot = (controller: ReadableStreamDefaultController<Uint8Array>, text: string) => {
    if (!text) return false;
    if (!finalTextBuffer) return emitConversationText(controller, text);
    if (!text.startsWith(finalTextBuffer)) return false;
    const delta = text.slice(finalTextBuffer.length);
    return emitConversationText(controller, delta);
  };

  const conversationToolName = (event: any) => event?.name ?? event?.tool_name ?? event?.tool?.name ?? String(event?.type ?? "conversation_tool").replace(/[^a-z0-9_]+/gi, "_");

  const conversationToolCallId = (event: any) => event?.tool_call_id ?? event?.call_id ?? event?.id ?? event?.tool_execution_id ?? event?.execution_id;

  const emitConversationToolExecution = (event: any, controller: ReadableStreamDefaultController<Uint8Array>, includeOutput: boolean) => {
    const toolCallId = conversationToolCallId(event);
    if (!toolCallId) return false;
    const toolName = conversationToolName(event);
    ensureStepStarted(controller);
    if (!startedToolCalls.has(toolCallId)) {
      enqueueChunk(controller, {
        type: "tool-input-start",
        toolCallId,
        toolName,
        providerExecuted: true,
        title: event?.title ?? toolName,
        providerMetadata: providerMetadataFor({ raw: event }, "mistral"),
      });
      startedToolCalls.add(toolCallId);
    }
    enqueueChunk(controller, {
      type: "tool-input-available",
      toolCallId,
      toolName,
      input: safeJsonParse(event?.arguments ?? event?.input ?? event?.tool_input ?? {}),
      providerExecuted: true,
      title: event?.title ?? toolName,
      providerMetadata: providerMetadataFor({ raw: event }, "mistral"),
    });
    if (includeOutput && !emittedToolOutputs.has(toolCallId)) {
      enqueueChunk(controller, {
        type: "tool-output-available",
        toolCallId,
        output: event?.result ?? event?.output ?? event?.tool_output ?? event,
        providerExecuted: true,
        providerMetadata: providerMetadataFor({ raw: event }, "mistral"),
      });
      emittedToolOutputs.add(toolCallId);
    }
    return true;
  };

  const handleConversationsPayload = (event: any, controller: ReadableStreamDefaultController<Uint8Array>, eventName?: string) => {
    const type = eventName ?? event?.type;
    if (event?.error || type === "conversation.response.error") {
      const error = event?.error ?? event;
      enqueueChunk(controller, { type: "error", errorText: error?.message ?? error?.detail ?? "Mistral conversation request failed." });
      finish(controller, "error");
      return;
    }

    if (type === "conversation.response.started" || type === "conversation.response.in_progress") {
      ensureMessageStarted(controller);
      return;
    }

    if (type === "message.output.delta") {
      const content = event?.content ?? event?.delta?.content ?? event?.message?.content;
      emitConversationArtifacts(controller, content);
      emitConversationText(controller, conversationTextFromParts(content) || extractGenericStreamText(endpoint, event));
      return;
    }

    if (type === "message.output.done" || type === "message.output.completed") {
      const content = event?.content ?? event?.message?.content;
      emitConversationArtifacts(controller, content);
      emitConversationTextSnapshot(controller, conversationTextFromParts(content));
      return;
    }

    if (type === "tool.execution.started" || type === "tool.execution.delta") {
      emitConversationToolExecution(event, controller, false);
      return;
    }

    if (type === "tool.execution.done") {
      emitConversationToolExecution(event, controller, true);
      return;
    }

    if (type === "function.call.delta") {
      emitToolInput(
        controller,
        conversationToolCallId(event) ?? `conversation-function-${startedToolCalls.size}`,
        conversationToolName(event),
        typeof event?.arguments === "string" ? event.arguments : typeof event?.delta === "string" ? event.delta : undefined,
      );
      return;
    }

    if (type === "function.call.done") {
      emitToolInput(
        controller,
        conversationToolCallId(event),
        conversationToolName(event),
        undefined,
        safeJsonParse(event?.arguments ?? event?.input ?? {}),
      );
      return;
    }

    if (type === "agent.handoff.started" || type === "agent.handoff.done") {
      emitConversationToolExecution({ ...event, name: "agent_handoff" }, controller, type === "agent.handoff.done");
      return;
    }

    if (type === "conversation.response.done" || type === "conversation.response.completed") {
      conversationOutputItems(event).forEach((item) => emitConversationArtifacts(controller, item?.content ?? item));
      emitConversationTextSnapshot(controller, conversationTextSnapshot(event));
      finish(controller);
    }
  };

  const normalizeProviderPayload = (payload: string) => {
    const trimmed = String(payload ?? "").trim();
    if (trimmed.startsWith("message")) {
      const jsonStart = trimmed.indexOf("{");
      const doneStart = trimmed.indexOf("[DONE]");
      if (jsonStart >= 0) return trimmed.slice(jsonStart).trim();
      if (doneStart >= 0) return trimmed.slice(doneStart).trim();
      return trimmed.replace(/^message\s+/, "").trim();
    }
    if (trimmed.startsWith("event:")) {
      const dataLine = trimmed.split(/\r?\n/).find((line) => line.startsWith("data:"));
      return dataLine ? dataLine.slice(5).trim() : trimmed;
    }
    return trimmed;
  };

  const parseJsonPayload = (payload: string): any | undefined => {
    if (!payload || payload === "[DONE]") return payload;
    try {
      return JSON.parse(payload);
    } catch {
      return undefined;
    }
  };

  const emitToolInput = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    toolCallId: string | undefined,
    toolName: string | undefined,
    inputTextDelta: string | undefined,
    completeInput?: unknown,
  ) => {
    if (!toolCallId || !toolName) return;
    if (!startedToolCalls.has(toolCallId)) {
      enqueueChunk(controller, { type: "tool-input-start", toolCallId, toolName });
      startedToolCalls.add(toolCallId);
    }

    if (inputTextDelta) {
      enqueueChunk(controller, { type: "tool-input-delta", toolCallId, inputTextDelta });
    }

    if (completeInput !== undefined) {
      enqueueChunk(controller, { type: "tool-input-available", toolCallId, toolName, input: completeInput });
      startedToolCalls.delete(toolCallId);
    }
  };

  const normalizeToolDeltas = (eventName: string | undefined, event: any, controller: ReadableStreamDefaultController<Uint8Array>) => {
    if (isChatCompletionsEndpoint(endpoint)) {
      for (const choice of event?.choices ?? []) {
        for (const toolCall of choice?.delta?.tool_calls ?? []) {
          const toolCallId = toolCall.id ?? `tool-${toolCall.index ?? startedToolCalls.size}`;
          const toolName = toolCall.function?.name ?? "unknown_tool";
          const argsDelta = typeof toolCall.function?.arguments === "string" ? toolCall.function.arguments : undefined;
          emitToolInput(controller, toolCallId, toolName, argsDelta);
        }
      }
      return;
    }

    if (endpoint === "/v1/messages") {
      const contentBlock = event?.content_block;
      if (contentBlock?.type === "tool_use") {
        emitToolInput(controller, contentBlock.id, contentBlock.name, undefined, contentBlock.input ?? {});
        return;
      }

      if (eventName === "content_block_delta" || event?.type === "content_block_delta") {
        const delta = event?.delta;
        if (delta?.type === "input_json_delta") {
          emitToolInput(
            controller,
            event?.content_block_id ?? `tool-${event?.index ?? startedToolCalls.size}`,
            event?.name ?? "unknown_tool",
            typeof delta.partial_json === "string" ? delta.partial_json : undefined,
          );
        }
      }
    }
  };

  const getTextDelta = (eventName: string | undefined, event: any) => {
    if (!event || typeof event !== "object") return "";

    if (isChatCompletionsEndpoint(endpoint)) {
      if (event.object && event.object !== "chat.completion.chunk") return "";
      return (event.choices ?? [])
        .map((choice: any) => choice?.delta?.content)
        .filter((value: any) => typeof value === "string")
        .join("");
    }

    if (endpoint === "/v1/messages") {
      const type = eventName ?? event.type;
      if (type !== "content_block_delta") return "";
      if (event?.delta?.type && event.delta.type !== "text_delta") return "";
      return typeof event?.delta?.text === "string" ? event.delta.text : "";
    }

    return extractGenericStreamText(endpoint, event);
  };

  const emitChatCompletionReasoningDeltas = (event: any, controller: ReadableStreamDefaultController<Uint8Array>) => {
    if (!isChatCompletionsEndpoint(endpoint)) return false;
    if (!event || typeof event !== "object") return false;
    if (event.object && event.object !== "chat.completion.chunk") return false;

    let emitted = false;
    for (const choice of event.choices ?? []) {
      const delta = choice?.delta?.reasoning ?? choice?.delta?.reasoning_content;
      if (typeof delta !== "string" || !delta) continue;
      const id = `reasoning-chat-completion-${choice?.index ?? 0}`;
      emitReasoningDelta(controller, id, delta);
      emitted = true;
    }

    return emitted;
  };

  const handlePayload = (rawPayload: string, controller: ReadableStreamDefaultController<Uint8Array>, eventName?: string) => {
    const payload = normalizeProviderPayload(rawPayload);
    if (!payload) return;
    if (payload === "[DONE]") {
      finish(controller);
      return;
    }

    if (payload.startsWith("[")) return;

    const parsed = parseJsonPayload(payload);
    if (!parsed || typeof parsed !== "object") return;

    rememberMetadata(parsed);
    if (endpoint === "/v1/responses") {
      handleResponsesPayload(parsed, controller, eventName);
      return;
    }

    if (endpoint === "/v1/conversations") {
      handleConversationsPayload(parsed, controller, eventName);
      return;
    }

    if (endpoint === "/v1/agents") {
      handleZaiAgentsPayload(parsed, controller);
      return;
    }

    if (endpoint === "/v1beta/interactions") {
      handleInteractionsPayload(parsed, controller, eventName);
      return;
    }

    normalizeToolDeltas(eventName, parsed, controller);
    if (handleMessagesReasoningPayload(parsed, controller, eventName)) return;
    emitChatCompletionReasoningDeltas(parsed, controller);
    const delta = getTextDelta(eventName, parsed);
    if (!delta) return;
    closeActiveReasoning(controller);
    ensureStarted(controller);
    enqueueChunk(controller, { type: "text-delta", id: textPartId, delta });
  };

  const flushEvent = (rawEvent: string, controller: ReadableStreamDefaultController<Uint8Array>) => {
    const lines = rawEvent.split(/\r?\n/);
    const eventName = lines
      .find((line) => line.startsWith("event:"))
      ?.slice(6)
      .trim();
    const dataLines = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim());

    if (dataLines.length > 0) {
      dataLines.forEach((payload) => handlePayload(payload, controller, eventName));
      return;
    }

    lines
      .map((line) => line.trim())
      .filter(Boolean)
      .map(normalizeProviderPayload)
      .filter((line) => line === "[DONE]" || line.startsWith("{") || line.startsWith("["))
      .forEach((payload) => handlePayload(payload, controller, eventName));
  };

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = source.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

          let boundaryIndex = buffer.search(/\r?\n\r?\n/);
          while (boundaryIndex >= 0) {
            const rawEvent = buffer.slice(0, boundaryIndex);
            buffer = buffer.slice(boundaryIndex + (buffer[boundaryIndex] === "\r" ? 4 : 2));
            flushEvent(rawEvent, controller);
            boundaryIndex = buffer.search(/\r?\n\r?\n/);
          }

          if (endpoint === "/v1/messages" && boundaryIndex < 0) {
            let lineBreak = buffer.search(/\r?\n/);
            while (lineBreak >= 0) {
              const rawLine = buffer.slice(0, lineBreak);
              buffer = buffer.slice(lineBreak + (buffer[lineBreak] === "\r" ? 2 : 1));
              if (rawLine.trim()) flushEvent(rawLine, controller);
              lineBreak = buffer.search(/\r?\n/);
            }
          }

          if (done) break;
        }

        if (buffer.trim()) {
          flushEvent(buffer, controller);
        }

        finish(controller);
      } catch (err: any) {
        enqueueChunk(controller, { type: "error", errorText: err?.message ?? "Generic chat stream failed." });
      } finally {
        controller.close();
      }
    },
  });
};

export class GenericChatEndpointTransport extends DefaultChatTransport<any> {
  constructor(
    private readonly genericEndpoint: GenericEndpointId,
    private readonly providerKey?: string,
    private readonly providers?: Record<string, Provider>,
    options: ConstructorParameters<typeof DefaultChatTransport<any>>[0] = {},
  ) {
    super(options);
  }

  protected processResponseStream(stream: ReadableStream<Uint8Array>): any {
    return super.processResponseStream(createUiMessageChunkStream({
      endpoint: this.genericEndpoint,
      providerKey: this.providerKey,
      source: stream,
      providers: this.providers,
    }));
  }
}

export function wrapGenericChatFetch({
  endpoint,
  fetcher,
  providerKey,
  providers,
}: {
  endpoint: GenericEndpointId;
  fetcher: typeof fetch;
  providerKey?: string;
  providers?: Record<string, Provider>;
}): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const requestEndpoint = getEndpointFromRequestInput(input) ?? endpoint;
    if (!requestEndpoint) {
      return fetcher(input, init);
    }

    let requestModel: string | undefined;
    let rawBody: any | undefined;
    let nextInit = init;

    try {
      if (typeof init?.body === "string") {
        rawBody = JSON.parse(init.body);
      } else if (typeof Request !== "undefined" && input instanceof Request) {
        const text = await input.clone().text();
        rawBody = text ? JSON.parse(text) : undefined;
      }

      requestModel = typeof rawBody?.model === "string" ? rawBody.model : undefined;

      const hasRawUiMessages = Array.isArray(rawBody?.messages)
        && rawBody.messages.some((message: any) => Array.isArray(message?.parts));
      if (hasRawUiMessages) {
        nextInit = {
          ...(init ?? {}),
          body: JSON.stringify(buildGenericChatEndpointBody(requestEndpoint, rawBody)),
        };
      }
    } catch {
      requestModel = undefined;
    }

    const response = await fetcher(input, nextInit);
    if (!response.body) return response;

    return new Response(createUiMessageChunkStream({ endpoint: requestEndpoint, providerKey, source: response.body, requestModel, providers }), {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  };
}
