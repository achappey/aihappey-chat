import type { ChatEndpointId } from "aihappey-state";
import type { Provider } from "aihappey-types";
import { DefaultChatTransport } from "aihappey-ai";
import { buildGenericChatEndpointBody, type GenericEndpointId } from "./genericEndpointMappers";
import { ANTHROPIC_THINKING_METADATA_TYPES, GENERIC_CHAT_ENDPOINT_IDS, compactObject } from "./genericEndpointMappers/types";
import { createResponsesShellToolMapper } from "./responsesShellTools";
import { createResponsesToolSearchMapper } from "./responsesToolSearch";
import { createResponsesProgramMapper } from "./responsesPrograms";
import { createDirectChatPerformance, type DirectChatPerformance } from "./directChatPerformance";
import { isGatewayResponsesTool, gatewayResponsesResult, gatewayResponsesMetadata } from "./responsesSyntheticTools";
import {
  isMessagesProviderCall, isMessagesProviderResult, isMessagesToolCall,
  messagesBlockMetadata, messagesToolError, messagesToolOutput,
} from "./messagesNativeTools";

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

const providerKeyFromModel = (modelId?: string) => modelId?.includes("/") ? normalizeProviderKey(modelId.split("/")[0]) : undefined;

export const isGenericChatEndpoint = (endpoint: ChatEndpointId | string | undefined): endpoint is GenericEndpointId =>
  (GENERIC_CHAT_ENDPOINT_IDS as readonly string[]).includes(String(endpoint ?? ""));

const isChatCompletionsEndpoint = (endpoint: GenericEndpointId) =>
  endpoint === "/v1/chat/completions" || endpoint === "/paas/v4/chat/completions"
  || endpoint === "/v1/openai/chat/completions" || endpoint == "/chat/completions";

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

  if (endpoint === "/v1/chat/completions") {
    return event?.choices
      ?.map((choice: any) => extractTextFromValue(choice?.delta?.content))
      .filter(Boolean)
      .join("") ?? "";
  }

  return "";
};

  const textToDataUrl = (text: string, mediaType: string) =>
    `data:${mediaType};charset=utf-8,${encodeURIComponent(text)}`;

  const textToBase64DataUrl = (text: string, mediaType: string) => {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return `data:${mediaType};base64,${btoa(binary)}`;
  };

  const normalizeEscapedHtmlText = (html: string) => html
    .replace(/\\\\r\\\\n/g, "\n")
    .replace(/\\\\n/g, "\n")
    .replace(/\\\\t/g, "\t")
    .replace(/\\\\"/g, "\"")
    .replace(/\\\\\//g, "/")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, "\"")
    .replace(/\\\//g, "/")
    .replace(/\\\\/g, "\\");

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
  performance,
}: {
  endpoint: GenericEndpointId;
  providerKey?: string;
  source: ReadableStream<Uint8Array>;
  requestModel?: string;
  providers?: Record<string, Provider>;
  performance?: DirectChatPerformance;
}): ReadableStream<Uint8Array> => {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let textPartId = "text-1";
  const messageId = `generic-${crypto.randomUUID()}`;
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
  let responsesContinuation: Record<string, any> | undefined;
  let finalTextBuffer = "";
  const startedToolCalls = new Set<string>();
  const emittedToolOutputs = new Set<string>();
  const activeReasoningIds = new Set<string>();
  const closedReasoningIds = new Set<string>();
  const reasoningTextById = new Map<string, string>();
  const reasoningProviderMetadataById = new Map<string, Record<string, any>>();
  const toolInputTextById = new Map<string, string>();
  const toolNameById = new Map<string, string>();
  const toolProviderMetadataById = new Map<string, Record<string, any>>();
  const completedResponsesToolInputs = new Set<string>();
  const responsesProviderToolItems = new Map<string, any>();
  const responsesProviderToolsByCallId = new Map<string, any>();
  const responsesProviderResultsByCallId = new Map<string, any>();
  const interactionsStepsByIndex = new Map<number, any>();
  const emittedSourceKeys = new Set<string>();
  const imageGenerationItems = new Map<string, any>();
  const imageGenerationFinalFiles = new Set<string>();
  const messagesContentBlocksByIndex = new Map<number, any>();
  const messagesReasoningIdsByIndex = new Map<number, string>();
  const messagesStoppedBlocks = new Set<number>();
  const messagesCompletedToolIds = new Set<string>();
  const messagesProviderToolIds = new Set<string>();
  let messagesNativeId: string | undefined;
  let messagesStopReason: string | undefined;
  const responsesTextById = new Map<string, string>();
  const responsesMessageItems = new Map<string, any>();
  const responsesTextMetadataById = new Map<string, Record<string, any>>();
  type ResponsesFunctionState = { item: any; argumentsText: string; emitted: boolean; started: boolean };
  const responsesFunctionItems = new Map<string, ResponsesFunctionState>();
  const responsesFunctionStates = new Set<ResponsesFunctionState>();
  let sourceReader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let cancelled = false;
  let emittedClientToolInput = false;
  let zaiAgentReasoningOrdinal = 0;
  let activeZaiAgentReasoningId: string | undefined;
  let zaiAgentToolOrdinal = 0;
  let activeZaiAgentTool: {
    toolCallId: string;
    toolName: string;
    title?: string;
    inputText: string;
    outputText: string;
    jsonOutputs: any[];
    inputAvailable: boolean;
    inputDeltaJsonOpen: boolean;
    position?: any;
    lastEvent?: any;
    lastObjectPart?: any;
  } | undefined;

  const enqueueChunk = (controller: ReadableStreamDefaultController<Uint8Array>, chunk: any, generatedOutput = true) => {
    if (generatedOutput) performance?.observe(chunk);
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
  };

  const messageMetadata = () => {
    const metadataProviderKey = endpoint === "/v1/messages" ? resolveProviderKey() : providerKey;
    return {
      model: latestModel,
      usage: latestUsage,
      ...(responsesContinuation ? { responsesContinuation } : {}),
      providerMetadata: {
        gateway: performance?.gatewayMetadata(latestGateway) ?? latestGateway,
        ...(metadataProviderKey
          ? {
            [metadataProviderKey]: compactObject({
              ...(latestProviderStreamMetadata ?? {}),
              usage: latestRawUsage,
            }),
          }
          : {}),
      },
      timestamp: new Date().toISOString(),
    };
  };

  const resolveProvider = () => {
    const resolvedProviderKey = resolveProviderKey();
    return resolvedProviderKey ? providers?.[resolvedProviderKey] : undefined;
  };

  const resolveProviderKey = () => normalizeProviderKey(providerKey) ?? providerKeyFromModel(latestModel) ?? providerKeyFromModel(requestModel);

  const createReasoningProviderMetadata = (item?: any) => {
    const resolvedProviderKey = resolveProviderKey();
    if (!resolvedProviderKey) return undefined;

    const providerEntry = compactObject({
      ...(endpoint === "/v1/responses" ? compactObject({
        id: item?.id,
        item_id: item?.id,
        summary: item?.summary,
        output_index: item?.output_index,
      }) : {}),
      encrypted_content: typeof item?.encrypted_content === "string" && item.encrypted_content
        ? item.encrypted_content
        : item?.type === ANTHROPIC_THINKING_METADATA_TYPES.redactedThinking ? item.data : undefined,
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
      ...(endpoint === "/v1/messages" ? compactObject({ block_index: item?.block_index, message_id: item?.message_id }) : {}),
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
      // The SDK continues the existing assistant message across client-tool
      // steps. Replacing its id would append a copy of all previous parts.
      ...(endpoint === "/v1/responses" || endpoint === "/v1/messages" ? {} : { messageId }),
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
    enqueueChunk(controller, { type: "text-end", id: textPartId, providerMetadata: responsesTextMetadataById.get(textPartId) });
    endedText = true;
    startedText = false;
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
    if (!["error", "failed", "cancelled", "incomplete"].includes(finishReason)) {
      performance?.complete(latestUsage?.completionTokens);
    }
    if (endpoint === "/v1/responses" || endpoint === "/v1/messages") {
      ensureMessageStarted(controller);
      closeActiveReasoning(controller);
      closeText(controller);
      if (startedStep) enqueueChunk(controller, { type: "finish-step" });
    } else if (!finalTextBuffer && emittedClientToolInput) {
      closeActiveReasoning(controller);
      ensureMessageStarted(controller);
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

  const getChatCompletionChoiceUsage = (event: any) => {
    if (!isChatCompletionsEndpoint(endpoint)) return undefined;

    for (const choice of event?.choices ?? []) {
      const usage = choice?.usage ?? choice?.delta?.usage;
      if (usage && typeof usage === "object") return usage;
    }

    return undefined;
  };

  const rememberMetadata = (event: any) => {
    if (!event || typeof event !== "object") return;
    latestModel = event.model
      ?? event.message?.model
      ?? event.response?.model
      ?? event.conversation?.model
      ?? event.interaction?.model
      ?? (endpoint === "/v1/agents" ? event.agent_id : undefined)
      ?? latestModel;
    const usage = event.usage
      ?? event.message?.usage
      ?? event.response?.usage
      ?? event.conversation?.usage
      ?? event.interaction?.usage
      ?? event.metadata?.total_usage
      ?? getChatCompletionChoiceUsage(event);
    if (usage) {
      // Messages usage updates are cumulative, partial snapshots. In particular,
      // message_delta normally omits the input count from message_start.
      latestRawUsage = endpoint === "/v1/messages"
        ? { ...latestRawUsage, ...Object.fromEntries(Object.entries(usage).filter(([, value]) => value != null)) }
        : usage;
      const normalizedUsage = endpoint === "/v1/messages" ? {
        ...latestRawUsage,
        input_tokens: (latestRawUsage.input_tokens ?? 0)
          + (latestRawUsage.cache_creation_input_tokens ?? 0) + (latestRawUsage.cache_read_input_tokens ?? 0),
      } : latestRawUsage;
      latestUsage = normalizeUsage(normalizedUsage) ?? latestUsage;
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

    if (endpoint === "/v1/messages") {
      latestProviderStreamMetadata = compactObject({
        ...(latestProviderStreamMetadata ?? {}),
        id: event.message?.id ?? latestProviderStreamMetadata?.id,
        container: event.container ?? event.message?.container ?? latestProviderStreamMetadata?.container,
        stop_reason: event.delta?.stop_reason ?? latestProviderStreamMetadata?.stop_reason,
        stop_sequence: event.delta?.stop_sequence ?? latestProviderStreamMetadata?.stop_sequence,
      });
    }

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
    if (isGatewayResponsesTool(item)) return item.name;
    const type = String(item?.type ?? "");
    if (type === "web_search_call") return "web_search";
    if (type === "image_generation_call") return "image_generation";
    if (type === "function_call") return typeof item?.name === "string" && item.name.trim() ? item.name : "function_call";
    if (type.endsWith("_call")) return type.replace(/_call$/, "");
    return typeof item?.name === "string" && item.name.trim() ? item.name : type || "provider_tool";
  };

  const isResponsesToolCall = (item: any) => typeof item?.type === "string"
    && (item.type.endsWith("_call") || item.type === "mcp_list_tools" || item.type === "program"
      || /:(datetime|web_fetch|experimental__search_models)$/.test(item.type));

  const isResponsesToolResult = (item: any) => typeof item?.type === "string"
    && (item.type.endsWith("_call_output") || item.type === "program_output");

  const expectsSeparateResponsesResult = (item: any) => item?.type === "program";

  const compactToolInput = (value: Record<string, any>) => Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null),
  );

  const responsesToolInput = (item: any) => {
    if (item?.type === "apply_patch_call") return { operation: item.operation };
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
    if (isGatewayResponsesTool(item)) return gatewayResponsesResult(item);
    if (item?.type === "web_search_call") {
      return compactToolInput({
        status: item?.status,
        action: item?.action,
        results: item?.results,
      });
    }

    return item?.output ?? item?.result ?? item;
  };

  const isClientExecutableResponsesTool = (item: any) => item?.type === "function_call" || item?.type === "apply_patch_call";

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
    if (typeof itemId !== "string" || !itemId.trim()) throw new Error("Responses image generation item is missing its native identifier.");
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
    if (emittedToolOutputs.has(toolCallId)) return;

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
      if (emittedToolOutputs.has(event.item_id)) return true;
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
        if (emitImageGenerationFile(controller, item, item?.result, false)) imageGenerationFinalFiles.add(item.id);
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
    const isPatch = item?.type === "apply_patch_call";
    if (isPatch && (!includeOutput || item.status !== "completed" || !item.operation)) return;
    const toolCallId = isPatch ? item?.call_id : item?.id ?? item?.call_id;
    if (typeof toolCallId !== "string" || !toolCallId.trim()) throw new Error("Responses tool is missing its native identifier.");
    if (isPatch && startedToolCalls.has(toolCallId)) return;
    if (!isPatch && emittedToolOutputs.has(toolCallId)) return;
    if (["custom_tool_call", "computer_call", "local_shell_call"].includes(item?.type)) {
      throw new Error(`Client-executed Responses ${item.type} is not supported by this adapter.`);
    }
    if (!isPatch) {
      item = { ...responsesProviderToolItems.get(toolCallId), ...item };
      responsesProviderToolItems.set(toolCallId, item);
      if (typeof item.call_id === "string" && item.call_id) responsesProviderToolsByCallId.set(item.call_id, item);
    }

    const toolName = responsesToolName(item);
    const providerExecuted = !isClientExecutableResponsesTool(item);
    const toolProviderMetadata = isGatewayResponsesTool(item) ? gatewayResponsesMetadata(item, resolveProviderKey() ?? "openai") : { [resolveProviderKey() ?? "openai"]: compactObject({
      type: item.type, id: item.id, item_id: item.id, call_id: item.call_id, status: item.status,
      caller: item.caller, namespace: item.namespace, created_by: item.created_by, output_index: item.output_index,
    }) };
    const title = isGatewayResponsesTool(item) ? toolProviderMetadata[resolveProviderKey() ?? "openai"].title
      : item?.type === "web_search_call" ? "Web search"
      : typeof item?.title === "string" ? item.title : typeof item?.name === "string" ? item.name : undefined;
    ensureStepStarted(controller);

    if (!startedToolCalls.has(toolCallId)) {
      enqueueChunk(controller, {
        type: "tool-input-start",
        toolCallId,
        toolName,
        providerExecuted,
        providerMetadata: toolProviderMetadata,
        title,
      });
      startedToolCalls.add(toolCallId);
    }

    if (!includeOutput) return;
    if (!completedResponsesToolInputs.has(toolCallId)) {
      completedResponsesToolInputs.add(toolCallId);
      enqueueChunk(controller, {
        type: "tool-input-available",
        toolCallId,
        toolName,
        input: responsesToolInput(item),
        providerExecuted,
        providerMetadata: toolProviderMetadata,
        title,
      });
    }

    if (includeOutput && providerExecuted && !emittedToolOutputs.has(toolCallId)) {
      const result = responsesProviderResultsByCallId.get(item.call_id);
      if (expectsSeparateResponsesResult(item) && !result) return;
      const resultItem = result ?? item;
      const resultProviderMetadata = result ? { [resolveProviderKey() ?? "openai"]: compactObject({
        type: result.type, id: result.id, output_item_id: result.id, call_id: result.call_id,
        tool_use_id: toolCallId, status: result.status, created_by: result.created_by,
      }) } : toolProviderMetadata;
      const failed = !isGatewayResponsesTool(item) && (resultItem?.error != null || (resultItem?.status && resultItem.status !== "completed"));
      enqueueChunk(controller, failed ? {
        type: "tool-output-error", toolCallId, providerExecuted: true, providerMetadata: resultProviderMetadata,
        errorText: typeof resultItem.error === "string" ? resultItem.error
          : typeof resultItem.error?.message === "string" ? resultItem.error.message : `Responses tool ${resultItem.status ?? "failed"}.`,
      } : {
        type: "tool-output-available",
        toolCallId,
        output: responsesToolOutput(resultItem),
        providerExecuted: true,
        providerMetadata: resultProviderMetadata,
      });
      emittedToolOutputs.add(toolCallId);
      if (isGatewayResponsesTool(item) && item.name === "download_file") {
        const output = gatewayResponsesResult(item);
        const file = output.structuredContent;
        const url = file?.data_url ?? file?.dataUrl ?? file?.url;
        if (output.isError !== true && typeof url === "string" && url) enqueueChunk(controller, {
          type: "file", url, mediaType: file.media_type ?? file.mediaType ?? "application/octet-stream",
          providerMetadata: { [resolveProviderKey() ?? "openai"]: {
            ...toolProviderMetadata[resolveProviderKey() ?? "openai"], filename: file.filename, file_id: file.file_id,
          } },
        });
      }
    }
  };

  const emitProviderToolResult = (controller: ReadableStreamDefaultController<Uint8Array>, item: any) => {
    if (typeof item?.call_id !== "string" || !item.call_id.trim()) return;
    if (!responsesProviderResultsByCallId.has(item.call_id)) responsesProviderResultsByCallId.set(item.call_id, item);
    const call = responsesProviderToolsByCallId.get(item.call_id);
    if (call && completedResponsesToolInputs.has(call.id ?? call.call_id)) emitProviderTool(controller, call, true);
  };

  const responsesShellTools = createResponsesShellToolMapper({
    emit: enqueueChunk,
    startStep: controller => { closeText(controller); ensureStepStarted(controller); },
    providerKey: () => resolveProviderKey() ?? "openai",
  });
  const responsesToolSearch = createResponsesToolSearchMapper({
    emit: enqueueChunk,
    startStep: controller => { closeText(controller); ensureStepStarted(controller); },
    providerKey: () => resolveProviderKey() ?? "openai",
  });
  const responsesPrograms = createResponsesProgramMapper({
    emit: enqueueChunk,
    startStep: controller => { closeText(controller); ensureStepStarted(controller); },
    providerKey: () => resolveProviderKey() ?? "openai",
  });

  // Native output-item ids identify stream items; call_id identifies the
  // executable invocation and its result. Persist both using the same metadata
  // shape as Gateway API chat, so no session or process-local map is replay state.
  const responsesFunctionMetadata = (state: ResponsesFunctionState) => ({
    [resolveProviderKey() ?? "openai"]: compactObject({
      type: "function_call",
      id: state.item.id,
      item_id: state.item.id,
      call_id: state.item.call_id,
      status: state.item.status,
      output_index: state.item.output_index,
      namespace: state.item.namespace,
      caller: state.item.caller,
      created_by: state.item.created_by,
    }),
  });

  const rememberResponsesFunction = (item: any, event?: any) => {
    const keys = [
      item?.id ?? event?.item_id,
      item?.call_id ? `call:${item.call_id}` : undefined,
      typeof event?.output_index === "number" ? `index:${event.output_index}` : undefined,
    ].filter((key): key is string => typeof key === "string" && !!key);
    if (!keys.length) throw new Error("Responses function call is missing its item identifier.");
    const state = keys.map(key => responsesFunctionItems.get(key)).find(Boolean)
      ?? { item: {}, argumentsText: "", emitted: false, started: false };
    state.item = { ...state.item, ...compactObject(item ?? {}), ...compactObject({ output_index: event?.output_index }) };
    if (typeof item?.arguments === "string" && item.arguments) state.argumentsText = item.arguments;
    keys.forEach(key => responsesFunctionItems.set(key, state));
    responsesFunctionStates.add(state);
    return state;
  };

  const startResponsesFunction = (controller: ReadableStreamDefaultController<Uint8Array>, state: ResponsesFunctionState) => {
    if (state.started || !state.item.call_id || !state.item.name) return;
    closeText(controller);
    ensureStepStarted(controller);
    enqueueChunk(controller, {
      type: "tool-input-start", toolCallId: state.item.call_id, toolName: state.item.name,
      providerExecuted: false, providerMetadata: responsesFunctionMetadata(state),
    });
    state.started = true;
  };

  const completeResponsesFunction = (controller: ReadableStreamDefaultController<Uint8Array>, state: ResponsesFunctionState) => {
    if (state.emitted) return;
    const { call_id: toolCallId, name: toolName, status } = state.item;
    if (!toolCallId || !toolName) throw new Error("Completed Responses function call is missing its call_id or name.");
    // A program-owned call can remain in_progress while the runtime waits for
    // our result. output_item.done completes its invocation, not its execution.
    const programOwned = state.item.caller?.type === "program"
      && typeof state.item.caller.caller_id === "string" && !!state.item.caller.caller_id.trim();
    if (status && status !== "completed" && !(programOwned && status === "in_progress")) {
      throw new Error(`Responses function call ${toolName} did not complete.`);
    }
    let input: unknown;
    try {
      input = JSON.parse(state.argumentsText);
      if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Expected an object.");
    } catch {
      throw new Error(`Responses function call ${toolName} has invalid or incomplete JSON arguments.`);
    }
    startResponsesFunction(controller, state);
    state.emitted = true;
    emittedClientToolInput = true;
    enqueueChunk(controller, {
      type: "tool-input-available", toolCallId, toolName, input, providerExecuted: false,
      providerMetadata: responsesFunctionMetadata(state),
    });
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

  const isZaiAgentIntermediateFinishReason = (finishReason: unknown) =>
    String(finishReason ?? "").trim() === "tool_calls";

  const createZaiAgentReasoningId = (event: any) =>
    `reasoning-zai-agent-${event?.id ?? event?.async_id ?? "stream"}-${++zaiAgentReasoningOrdinal}`;

  const emitZaiAgentReasoningDelta = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    event: any,
    delta: string,
  ) => {
    if (!delta) return false;
    closeText(controller);
    flushZaiAgentTool(controller, event, false);
    if (!activeZaiAgentReasoningId || !activeReasoningIds.has(activeZaiAgentReasoningId)) {
      activeZaiAgentReasoningId = createZaiAgentReasoningId(event);
    }
    emitReasoningDelta(controller, activeZaiAgentReasoningId, delta);
    return true;
  };

  const zaiAgentToolTitle = (objectPart: any, obj: any, fallbackToolName: string) =>
    obj?.title ?? objectPart?.title ?? objectPart?.tag_en ?? objectPart?.tag_cn ?? fallbackToolName;

  const createZaiAgentToolCallId = (event: any, toolName: string) =>
    `${event?.id ?? event?.async_id ?? "zai-agent"}-${toolName}-${++zaiAgentToolOrdinal}`;

  const isZaiAgentHtmlToolOutput = (toolName?: string, output?: string) => {
    const normalizedToolName = String(toolName ?? "").trim().toLowerCase();
    if (normalizedToolName === "add_slide" || normalizedToolName === "insert_page") {
      return Boolean(output);
    }
    return /<html[\s>]|<!doctype html/i.test(String(output ?? ""));
  };

  const sanitizeZaiAgentFileNamePart = (value: unknown, fallback: string) =>
    (String(value ?? "").trim().replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || fallback);

  const escapeJsonStringChunk = (value: string) => JSON.stringify(value).slice(1, -1);

  const zaiAgentSlideId = (tool: NonNullable<typeof activeZaiAgentTool>) => {
    const position = tool.position;
    if (Array.isArray(position) && position.length > 0) return position.filter(Boolean).join("-");
    if (position !== undefined && position !== null && String(position).trim()) return String(position).trim();
    return sanitizeZaiAgentFileNamePart(tool.title ?? tool.toolCallId, tool.toolCallId);
  };

  const createZaiAgentToolResult = (tool: NonNullable<typeof activeZaiAgentTool>, preliminary: boolean) => {
    const parsedOutput = tool.jsonOutputs.length === 0
      ? (tool.outputText ? safeJsonParse(tool.outputText) : undefined)
      : tool.jsonOutputs.length === 1
        ? tool.jsonOutputs[0]
        : tool.jsonOutputs;

    if (isZaiAgentHtmlToolOutput(tool.toolName, tool.outputText)) {
      const html = normalizeEscapedHtmlText(tool.outputText);
      const slideId = zaiAgentSlideId(tool);
      const filename = `${sanitizeZaiAgentFileNamePart(tool.title ?? slideId, "zai-slide")}.html`;
      return compactObject({
        tool_name: tool.toolName,
        title: tool.title,
        position: tool.position,
        media_type: "text/html",
        filename,
        url: textToBase64DataUrl(html, "text/html"),
        preliminary,
        html,
      });
    }

    return compactObject({
      tool_name: tool.toolName,
      title: tool.title,
      position: tool.position,
      preliminary,
      output: parsedOutput,
    });
  };

  const emitZaiAgentToolInputAvailable = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    event?: any,
  ) => {
    const tool = activeZaiAgentTool;
    if (!tool || tool.inputAvailable) return;
    if (tool.inputDeltaJsonOpen) {
      enqueueChunk(controller, {
        type: "tool-input-delta",
        toolCallId: tool.toolCallId,
        inputTextDelta: '"}',
      });
      tool.inputDeltaJsonOpen = false;
    }
    tool.inputAvailable = true;
    enqueueChunk(controller, {
      type: "tool-input-available",
      toolCallId: tool.toolCallId,
      toolName: tool.toolName,
      input: tool.inputText.trim() ? safeJsonParse(tool.inputText) : {},
      providerExecuted: true,
      title: tool.title,
      providerMetadata: zaiAgentProviderMetadata(event ?? tool.lastEvent, {
        phase: "tool",
        tool_name: tool.toolName,
        tool_title: tool.title,
      }),
    });
  };

  const emitZaiAgentToolOutputAvailable = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    event: any,
    preliminary: boolean,
  ) => {
    const tool = activeZaiAgentTool;
    if (!tool || (!tool.outputText && tool.jsonOutputs.length === 0)) return;
    enqueueChunk(controller, {
      type: "tool-output-available",
      toolCallId: tool.toolCallId,
      output: createZaiAgentToolResult(tool, preliminary),
      providerExecuted: true,
      providerMetadata: zaiAgentProviderMetadata(event ?? tool.lastEvent, {
        phase: "tool",
        tool_name: tool.toolName,
        tool_title: tool.title,
      }),
    });
  };

  const emitZaiAgentToolFile = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    event: any,
  ) => {
    const tool = activeZaiAgentTool;
    if (!tool || !isZaiAgentHtmlToolOutput(tool.toolName, tool.outputText)) return;
    const result = createZaiAgentToolResult(tool, false) as any;
    enqueueChunk(controller, {
      type: "file",
      url: result.url,
      mediaType: "text/html",
      providerMetadata: zaiAgentProviderMetadata(event ?? tool.lastEvent, {
        phase: "tool",
        tool_name: tool.toolName,
        tool_title: tool.title,
        filename: result.filename,
        final: true,
      }),
    });
  };

  const flushZaiAgentTool = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    event: any,
    preliminary: boolean,
  ) => {
    const tool = activeZaiAgentTool;
    if (!tool) return;
    emitZaiAgentToolInputAvailable(controller, event);
    if (tool.outputText || tool.jsonOutputs.length > 0) {
      emitZaiAgentToolOutputAvailable(controller, event, preliminary);
      if (!preliminary) emitZaiAgentToolFile(controller, event);
    }
    if (!preliminary) activeZaiAgentTool = undefined;
  };

  const ensureZaiAgentTool = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    event: any,
    objectPart: any,
    obj: any,
    toolName: string,
    title: string,
  ) => {
    closeActiveReasoning(controller);
    closeText(controller);

    const incomingStartsNewTool = activeZaiAgentTool
      && (
        activeZaiAgentTool.toolName !== toolName
        || ((activeZaiAgentTool.outputText || activeZaiAgentTool.jsonOutputs.length > 0) && obj?.input !== undefined && obj?.output === undefined)
      );
    if (incomingStartsNewTool) flushZaiAgentTool(controller, event, false);

    ensureStepStarted(controller);
    if (!activeZaiAgentTool) {
      activeZaiAgentTool = {
        toolCallId: obj?.id ?? createZaiAgentToolCallId(event, toolName),
        toolName,
        title,
        inputText: "",
        outputText: "",
        jsonOutputs: [],
        inputAvailable: false,
        inputDeltaJsonOpen: false,
      };
      const tool = activeZaiAgentTool;
      enqueueChunk(controller, {
        type: "tool-input-start",
        toolCallId: tool.toolCallId,
        toolName,
        providerExecuted: true,
        title,
        providerMetadata: zaiAgentProviderMetadata(event, { phase: "tool", tool_name: toolName, tool_title: title }),
      });
      startedToolCalls.add(tool.toolCallId);
    }

    const tool = activeZaiAgentTool;
    if (!tool) return undefined;
    tool.title ||= title;
    tool.lastEvent = event;
    tool.lastObjectPart = objectPart;
    if (obj?.position !== undefined) tool.position = obj.position;
    return tool;
  };

  const emitZaiAgentText = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    event: any,
    text?: string,
    phase?: string,
    generatedOutput = true,
  ) => {
    const delta = String(text ?? "");
    if (!delta) return false;

    if (phase === "thinking") {
      return emitZaiAgentReasoningDelta(controller, event, delta);
    }

    flushZaiAgentTool(controller, event, false);
    closeActiveReasoning(controller);
    ensureStarted(controller);
    finalTextBuffer += delta;
    enqueueChunk(controller, {
      type: "text-delta",
      id: textPartId,
      delta,
      providerMetadata: zaiAgentProviderMetadata(event, { phase }),
    }, generatedOutput);
    return true;
  };

  const emitZaiAgentToolObject = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    event: any,
    objectPart: any,
    _index: number,
    phase?: string,
  ) => {
    const obj = objectPart?.object && typeof objectPart.object === "object" ? objectPart.object : objectPart;
    const toolName = obj?.tool_name ?? objectPart?.tool_name ?? "zai_agent_tool";
    const title = zaiAgentToolTitle(objectPart, obj, toolName);
    const tool = ensureZaiAgentTool(controller, event, objectPart, obj, toolName, title);
    if (!tool) return;

    if (obj?.input !== undefined) {
      const rawInputDelta = typeof obj.input === "string" ? obj.input : JSON.stringify(obj.input);
      const inputTextDelta = tool.inputDeltaJsonOpen
        ? escapeJsonStringChunk(rawInputDelta)
        : `{"input":"${escapeJsonStringChunk(rawInputDelta)}`;
      if (inputTextDelta) {
        tool.inputText += rawInputDelta;
        tool.inputDeltaJsonOpen = true;
        enqueueChunk(controller, {
          type: "tool-input-delta",
          toolCallId: tool.toolCallId,
          inputTextDelta,
        });
      }
    }

    if (obj?.output !== undefined || obj?.result !== undefined) {
      emitZaiAgentToolInputAvailable(controller, event);
      const output = obj?.output ?? obj?.result;
      if (typeof output === "string") {
        tool.outputText += output;
      } else if (output !== undefined && output !== null) {
        tool.jsonOutputs.push(output);
      }
      emitZaiAgentToolOutputAvailable(controller, event, true);
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
        undefined,
        false,
      );
    }

    let emitted = false;
    for (const [choiceIndex, choice] of (event?.choices ?? []).entries()) {
      const message = choice?.messages ?? choice?.message ?? choice?.delta;
      if (message) emitted = handleZaiAgentMessage(controller, event, message, choiceIndex) || emitted;
      if (choice?.finish_reason) {
        rememberMetadata(event);
        if (isZaiAgentIntermediateFinishReason(choice.finish_reason)) {
          flushZaiAgentTool(controller, event, false);
          continue;
        }
        flushZaiAgentTool(controller, event, false);
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

  const isClientExecutableInteractionsTool = (step: any) => {
    const type = String(step?.type ?? "");
    return type === "function_call" || type === "function_result";
  };

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
    const providerExecuted = !isClientExecutableInteractionsTool(step);
    const inputProviderMetadata = providerMetadataFor({
      source: "interactions.step",
      index,
      step_type: step?.type,
      signature: step?.signature,
      server_name: step?.server_name,
    });
    ensureStepStarted(controller);

    if (!startedToolCalls.has(toolCallId)) {
      enqueueChunk(controller, {
        type: "tool-input-start",
        toolCallId,
        toolName,
        providerExecuted,
        title: toolName,
      });
      startedToolCalls.add(toolCallId);
    }

    enqueueChunk(controller, {
      type: "tool-input-available",
      toolCallId,
      toolName,
      input: interactionsToolInput(step),
      providerExecuted,
      title: toolName,
      providerMetadata: inputProviderMetadata,
    });
    if (!providerExecuted && inputProviderMetadata) toolProviderMetadataById.set(toolCallId, inputProviderMetadata);

    if (includeOutput && !emittedToolOutputs.has(toolCallId)) {
      enqueueChunk(controller, {
        type: "tool-output-available",
        toolCallId,
        output: interactionsToolOutput(step),
        providerExecuted,
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
        emitToolInput(controller, toolCallId, interactionsToolName(currentStep), delta?.arguments, undefined, providerMetadataFor({
          source: "interactions.step",
          index: event?.index,
          step_type: currentStep?.type,
          signature: currentStep?.signature,
          server_name: currentStep?.server_name,
        }));
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
      finalizePendingClientToolInputs(controller);
      for (const [index, step] of event?.interaction?.steps?.entries?.() ?? []) {
        emitInteractionsStepSnapshot(controller, step, index);
      }
      finish(controller, emittedClientToolInput && !finalTextBuffer ? "tool-calls" : "stop");
      return;
    }

    if (event?.object === "interaction" || Array.isArray(event?.steps)) {
      rememberMetadata({ interaction: event, ...event });
      for (const [index, step] of event?.steps?.entries?.() ?? []) {
        emitInteractionsStepSnapshot(controller, step, index);
      }
      if (event?.status === "completed" || event?.status === "incomplete" || event?.status === "cancelled" || event?.status === "failed") {
        finalizePendingClientToolInputs(controller);
        finish(controller, event.status === "completed" && emittedClientToolInput && !finalTextBuffer ? "tool-calls" : event.status === "completed" ? "stop" : event.status);
      }
    }
  };

  const messagesReasoningId = (index: number) => `reasoning-messages-${messageId}-${index}`;

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
    return rememberReasoningMetadata(id, { ...block, block_index: index, message_id: messagesNativeId });
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

  const messagesPartMetadata = (block: any, index: number) =>
    providerMetadataFor(messagesBlockMetadata(block, index, messagesNativeId));

  const emitMessagesCitation = (controller: ReadableStreamDefaultController<Uint8Array>, citation: any) => {
    if (citation?.type !== "web_search_result_location" || typeof citation.url !== "string" || !citation.url) return;
    const sourceId = citation.encrypted_index || citation.url;
    if (emittedSourceKeys.has(sourceId)) return;
    emittedSourceKeys.add(sourceId);
    ensureStepStarted(controller);
    enqueueChunk(controller, {
      type: "source-url", sourceId, url: citation.url, title: citation.title ?? citation.url,
      providerMetadata: providerMetadataFor({ ...citation }),
    });
  };

  const emitMessagesToolResult = (controller: ReadableStreamDefaultController<Uint8Array>, block: any, index: number) => {
    const id = block.tool_use_id;
    if (typeof id !== "string" || !id) throw new Error("Messages tool result requires a tool_use_id.");
    if (emittedToolOutputs.has(id) || !messagesCompletedToolIds.has(id)) return;
    if (!messagesProviderToolIds.has(id)) throw new Error("Messages provider result cannot complete a client tool call.");
    const errorText = messagesToolError(block);
    enqueueChunk(controller, {
      type: errorText ? "tool-output-error" : "tool-output-available",
      toolCallId: id, providerExecuted: true, providerMetadata: messagesPartMetadata(block, index),
      ...(errorText ? { errorText } : { output: messagesToolOutput(block) }),
    });
    emittedToolOutputs.add(id);
  };

  const handleMessagesPayload = (event: any, controller: ReadableStreamDefaultController<Uint8Array>, eventName?: string) => {
    const type = event?.type ?? eventName;
    const index = typeof event?.index === "number" ? event.index : undefined;
    if (type === "error") throw new Error(event.error?.message ?? event.message ?? "Messages request failed.");
    if (type === "message_start") {
      messagesNativeId = event.message?.id;
      ensureStepStarted(controller);
      return;
    }
    if (type === "message_delta") {
      messagesStopReason = event.delta?.stop_reason ?? messagesStopReason;
      return;
    }
    if (type === "message_stop") {
      if ([...messagesContentBlocksByIndex.keys()].some(key => !messagesStoppedBlocks.has(key))) {
        throw new Error("Messages ended with an incomplete content block.");
      }
      if (!messagesStopReason) throw new Error("Messages ended without a stop reason.");
      for (const block of messagesContentBlocksByIndex.values()) {
        if (isMessagesProviderResult(block) && !emittedToolOutputs.has(block.tool_use_id)) {
          throw new Error("Messages tool result has no completed provider tool call.");
        }
      }
      if (messagesStopReason === "max_tokens" && !finalTextBuffer && !emittedClientToolInput) {
        throw new Error("Messages reached max_tokens before producing an answer. Increase the maximum output tokens in the model or provider settings.");
      }
      finish(controller, messagesStopReason === "tool_use" ? "tool-calls"
        : ["max_tokens", "model_context_window_exceeded"].includes(messagesStopReason) ? "length"
        : messagesStopReason === "pause_turn" ? "other" : messagesStopReason === "refusal" ? "content-filter" : "stop");
      return;
    }
    if (type === "content_block_start" && index !== undefined) {
      const block = event.content_block;
      if (!block || messagesContentBlocksByIndex.has(index)) return;
      ensureStepStarted(controller);
      closeText(controller);
      closeActiveReasoning(controller);
      messagesContentBlocksByIndex.set(index, { ...block });
      if (handleMessagesReasoningPayload(event, controller, type)) return;
      if (isMessagesToolCall(block)) {
        if (typeof block.id !== "string" || !block.id || typeof block.name !== "string" || !block.name) {
          throw new Error("Messages tool call requires an id and name.");
        }
        if (isMessagesProviderCall(block)) messagesProviderToolIds.add(block.id);
        if (!startedToolCalls.has(block.id)) {
          startedToolCalls.add(block.id);
          toolNameById.set(block.id, block.name);
          enqueueChunk(controller, {
            type: "tool-input-start", toolCallId: block.id, toolName: block.name,
            providerExecuted: isMessagesProviderCall(block), providerMetadata: messagesPartMetadata(block, index),
            title: block.title ?? block.name,
          });
        }
      } else if (block.type === "text") {
        textPartId = `messages-text-${messageId}-${index}`;
        responsesTextMetadataById.set(textPartId, messagesPartMetadata(block, index) ?? {});
        ensureStarted(controller);
        if (block.text) {
          finalTextBuffer += block.text;
          enqueueChunk(controller, { type: "text-delta", id: textPartId, delta: block.text,
            providerMetadata: messagesPartMetadata(block, index) });
        }
        for (const citation of block.citations ?? []) emitMessagesCitation(controller, citation);
      }
      return;
    }
    if ((type === "content_block_delta" || type === "content_block_stop") && index !== undefined) {
      const block = messagesContentBlocksByIndex.get(index);
      if (!block) throw new Error("Messages received an unknown content block index.");
      if (messagesStoppedBlocks.has(index)) return;
      if (type === "content_block_stop") {
        messagesStoppedBlocks.add(index);
        if (handleMessagesReasoningPayload(event, controller, type)) return;
        if (block.type === "text") closeText(controller);
        if (isMessagesProviderResult(block)) emitMessagesToolResult(controller, block, index);
        if (isMessagesToolCall(block) && !messagesCompletedToolIds.has(block.id)) {
          // Parameterless tools may send an input_json_delta with an empty
          // partial_json. Only a non-empty JSON document replaces the initial
          // input snapshot; malformed non-empty documents must still fail.
          const inputText = toolInputTextById.get(block.id) ?? "";
          const input = inputText.trim() ? JSON.parse(inputText) : block.input ?? {};
          if (!input || typeof input !== "object" || Array.isArray(input)) {
            throw new Error("Messages tool input must be a JSON object.");
          }
          messagesCompletedToolIds.add(block.id);
          if (!isMessagesProviderCall(block)) emittedClientToolInput = true;
          enqueueChunk(controller, {
            type: "tool-input-available", toolCallId: block.id, toolName: block.name, input,
            providerExecuted: isMessagesProviderCall(block), providerMetadata: messagesPartMetadata(block, index),
            title: block.title ?? block.name,
          });
          toolInputTextById.delete(block.id);
          for (const [resultIndex, result] of messagesContentBlocksByIndex) {
            if (isMessagesProviderResult(result) && result.tool_use_id === block.id && messagesStoppedBlocks.has(resultIndex)) {
              emitMessagesToolResult(controller, result, resultIndex);
            }
          }
        }
        return;
      }
      if (handleMessagesReasoningPayload(event, controller, type)) return;
      if (isMessagesToolCall(block) && event.delta?.type === "input_json_delta" && !messagesCompletedToolIds.has(block.id)) {
        // An initial input snapshot is not a JSON prefix. Streamed JSON replaces
        // it, and is parsed strictly only when this particular block stops.
        const partial = event.delta.partial_json;
        if (typeof partial === "string") {
          toolInputTextById.set(block.id, `${toolInputTextById.get(block.id) ?? ""}${partial}`);
          if (partial) enqueueChunk(controller, { type: "tool-input-delta", toolCallId: block.id, inputTextDelta: partial });
        }
      } else if (block.type === "text" && event.delta?.type === "text_delta" && typeof event.delta.text === "string") {
        const id = `messages-text-${messageId}-${index}`;
        if (textPartId !== id) { closeText(controller); textPartId = id; }
        ensureStarted(controller);
        finalTextBuffer += event.delta.text;
        enqueueChunk(controller, { type: "text-delta", id: textPartId, delta: event.delta.text,
          providerMetadata: messagesPartMetadata(block, index) });
      } else if (block.type === "text" && event.delta?.type === "citations_delta" && event.delta.citation) {
        block.citations = [...(block.citations ?? []), event.delta.citation];
        responsesTextMetadataById.set(`messages-text-${messageId}-${index}`, messagesPartMetadata(block, index) ?? {});
        emitMessagesCitation(controller, event.delta.citation);
      }
    }
  };

  const responsesTextMetadata = (itemId?: string) => {
    const item = itemId ? responsesMessageItems.get(itemId) : undefined;
    return providerMetadataFor({ id: itemId, item_id: itemId, phase: item?.phase, output_index: item?.output_index }, "openai");
  };

  const rememberResponsesMessage = (item: any, outputIndex?: number) => {
    responsesMessageItems.set(item.id, { ...responsesMessageItems.get(item.id), ...item,
      ...(outputIndex !== undefined ? { output_index: outputIndex } : {}) });
    for (const id of responsesTextById.keys()) {
      if (id.startsWith(`responses-text-${item.id}-`)) responsesTextMetadataById.set(id, responsesTextMetadata(item.id)!);
    }
  };

  const emitResponsesTextDelta = (controller: ReadableStreamDefaultController<Uint8Array>, delta: string, itemId?: string, contentIndex = 0) => {
    if (!delta) return false;
    const id = `responses-text-${itemId ?? "message"}-${contentIndex}`;
    if (id !== textPartId) {
      closeText(controller);
      textPartId = id;
    }
    ensureStarted(controller);
    const providerMetadata = responsesTextMetadata(itemId);
    if (providerMetadata) responsesTextMetadataById.set(id, providerMetadata);
    responsesTextById.set(id, `${responsesTextById.get(id) ?? ""}${delta}`);
    finalTextBuffer += delta;
    enqueueChunk(controller, { type: "text-delta", id, delta, providerMetadata });
    return true;
  };

  const emitResponsesTextSnapshot = (controller: ReadableStreamDefaultController<Uint8Array>, value: any, itemId?: string, contentIndex = 0): boolean => {
    if (Array.isArray(value)) {
      let emitted = false;
      value.forEach((part, index) => { emitted = emitResponsesTextSnapshot(controller, part, itemId, index) || emitted; });
      return emitted;
    }
    const text = typeof value?.refusal === "string" ? value.refusal : extractTextFromValue(value);
    const previous = responsesTextById.get(`responses-text-${itemId ?? "message"}-${contentIndex}`) ?? "";
    return text.startsWith(previous) && text.length > previous.length
      ? emitResponsesTextDelta(controller, text.slice(previous.length), itemId, contentIndex) : false;
  };

  const emitResponsesReasoningSnapshot = (controller: ReadableStreamDefaultController<Uint8Array>, item: any, outputIndex?: number) => {
    const summaries = Array.isArray(item.summary) && item.summary.length ? item.summary : [{ text: "" }];
    summaries.forEach((summary: any, index: number) => {
      const id = responseReasoningId({ item_id: item.id, summary_index: index });
      const metadata = rememberReasoningMetadata(id, { ...item, output_index: outputIndex });
      if (closedReasoningIds.has(id)) return;
      ensureReasoning(controller, id, metadata);
      const text = getTextFromResponseSummary(summary);
      const previous = reasoningTextById.get(id) ?? "";
      if (text.startsWith(previous) && text.length > previous.length) emitReasoningDelta(controller, id, text.slice(previous.length));
      closeReasoning(controller, id);
    });
  };

  const getTextFromResponseSummary = (summary: any) => typeof summary?.text === "string" ? summary.text : "";

  const applyProviderResponseOverride = (event: any, eventName?: string) => {
    const resolvedProviderKey = resolveProviderKey();
    const override = resolvedProviderKey ? RESPONSE_PROVIDER_STREAM_OVERRIDES[resolvedProviderKey] : undefined;
    return override?.({ event, eventName, endpoint, requestModel: latestModel ?? requestModel }) === true;
  };

  const handleResponsesPayload = (event: any, controller: ReadableStreamDefaultController<Uint8Array>, eventName?: string) => {
    if (applyProviderResponseOverride(event, eventName)) return;

    const type = event?.type ?? eventName;

    if (type === "error" || type === "response.failed" || type === "response.incomplete" || type === "response.cancelled") {
      throw new Error(event?.error?.message ?? event?.response?.error?.message ?? event?.message
        ?? `Responses request ${type.replace("response.", "")}: ${event?.response?.incomplete_details?.reason ?? "generation did not complete"}.`);
    }

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
      ensureReasoning(controller, id, rememberReasoningMetadata(id, { ...event.item, output_index: event.output_index }));
      return;
    }

    if (type === "response.output_item.done" && event?.item?.type === "reasoning") {
      emitResponsesReasoningSnapshot(controller, event.item, event.output_index);
      return;
    }

    if ((type === "response.output_item.added" || type === "response.output_item.done") && event?.item?.type === "message") {
      rememberResponsesMessage(event.item, event.output_index);
      if (type === "response.output_item.done") {
        emitResponsesTextSnapshot(controller, event.item?.content, event.item.id);
        if (textPartId.startsWith(`responses-text-${event.item.id}-`)) closeText(controller);
      }
      return;
    }

    if ((type === "response.output_item.added" || type === "response.output_item.done") && event?.item?.type === "function_call") {
      const state = rememberResponsesFunction(event.item, event);
      if (type === "response.output_item.done") completeResponsesFunction(controller, state);
      else startResponsesFunction(controller, state);
      return;
    }

    if (type === "response.function_call_arguments.delta" || type === "response.function_call_arguments.done") {
      const state = rememberResponsesFunction(undefined, event);
      if (state.emitted) return;
      startResponsesFunction(controller, state);
      if (type.endsWith(".done")) {
        if (typeof event.arguments === "string") state.argumentsText = event.arguments;
      } else if (typeof event.delta === "string") {
        state.argumentsText += event.delta;
        if (state.started) enqueueChunk(controller, { type: "tool-input-delta", toolCallId: state.item.call_id, inputTextDelta: event.delta });
      }
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

    if (responsesShellTools.handleEvent(controller, { ...event, type })) return;

    if (type === "response.output_item.added" || type === "response.output_item.done") {
      const completed = type === "response.output_item.done";
      if (responsesShellTools.handleItem(controller, event.item, event.output_index, completed)) return;
      if (responsesToolSearch.handleItem(controller, event.item, event.output_index, completed)) return;
      if (responsesPrograms.handleItem(controller, event.item, event.output_index, completed)) return;
      if (isResponsesToolResult(event.item)) {
        if (completed) emitProviderToolResult(controller, event.item);
      } else if (isResponsesToolCall(event.item)) emitProviderTool(controller, { ...event.item, output_index: event.output_index }, completed);
      return;
    }

    if (type?.startsWith("response.web_search_call.") && typeof event?.item_id === "string") {
      emitProviderTool(controller, { type: "web_search_call", id: event.item_id,
        status: type.replace("response.web_search_call.", "") }, false);
      return;
    }

    if ((type === "response.output_text.delta" || type === "response.refusal.delta") && typeof event?.delta === "string") {
      emitResponsesTextDelta(controller, event.delta, event.item_id, event.content_index);
      return;
    }

    if (type === "response.output_text.annotation.added") {
      emitSource(controller, event.annotation, event.annotation_index);
      return;
    }

    if (type === "response.output_text.done" || type === "response.refusal.done") {
      emitResponsesTextSnapshot(controller, event.text ?? event.refusal, event.item_id, event.content_index);
      return;
    }

    if (type === "response.content_part.done") {
      if (event?.part?.type === "output_text" || event?.part?.type === "refusal") {
        emitResponsesTextSnapshot(controller, event.part, event.item_id, event.content_index);
      }
      (event?.part?.annotations ?? []).forEach((annotation: any, index: number) => emitSource(controller, annotation, index));
      return;
    }

    if (type === "response.completed") {
      rememberMetadata(event);
      if (event?.response?.status && event.response.status !== "completed") throw new Error("Responses generation did not complete.");
      // Register native identities before emitting so snapshots can recover
      // missing live events, even when a provider lists a result before its call.
      for (const [index, item] of (event?.response?.output ?? []).entries()) {
        if (item?.type === "shell_call") responsesShellTools.handleItem(controller, item, index, false, true);
        responsesToolSearch.handleItem(controller, item, index, false, true);
        responsesPrograms.handleItem(controller, item, index, false, true);
      }
      for (const [index, item] of (event?.response?.output ?? []).entries()) {
        if (item.type === "function_call") completeResponsesFunction(controller, rememberResponsesFunction(item, { output_index: index }));
        else if (item.type === "reasoning") emitResponsesReasoningSnapshot(controller, item, index);
        else if (item.type === "message") {
          rememberResponsesMessage(item, index);
          emitResponsesTextSnapshot(controller, item.content, item.id);
        }
        else if (responsesShellTools.handleItem(controller, item, index, true)) continue;
        else if (responsesToolSearch.handleItem(controller, item, index, true)) continue;
        else if (responsesPrograms.handleItem(controller, item, index, true)) continue;
        else if (isImageGenerationItemType(item?.type)) {
          handleImageGenerationPayload({ type: "response.output_item.done", item, output_index: index }, controller);
        }
        else if (isResponsesToolResult(item)) emitProviderToolResult(controller, item);
        else if (isResponsesToolCall(item)) emitProviderTool(controller, { ...item, output_index: index }, true);
      }
      if (Array.from(responsesFunctionStates).some(state => !state.emitted)) throw new Error("Responses ended with an incomplete function call.");
      responsesShellTools.assertComplete();
      responsesToolSearch.assertComplete();
      responsesPrograms.complete(controller);
      if ([...responsesProviderToolItems.keys()].some(id => !emittedToolOutputs.has(id))) {
        throw new Error("Responses ended with an incomplete provider-hosted tool call/output.");
      }
      const output = event?.response?.output ?? [];
      const hasProgram = responsesPrograms.hasItems() || [...responsesFunctionStates].some(state => state.item.caller?.type === "program");
      if (hasProgram) {
        // Scheduling only. Replay state remains in provider-scoped UI parts.
        // Commentary is not a final assistant message.
        const finalMessage = output.some((item: any) => item.type === "message" && item.role === "assistant"
          && item.phase !== "commentary");
        responsesContinuation = { provider: resolveProviderKey() ?? "openai", responseId: event.response.id,
          continue: !finalMessage, progress: JSON.stringify(output.map((item: any) => [item.type, item.id, item.call_id, item.fingerprint, item.result])) };
      } else {
        // Clear an older step's marker when this response completes with text.
        responsesContinuation = { continue: emittedClientToolInput };
      }
      finish(controller, emittedClientToolInput ? "tool-calls" : "stop");
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
      finalizePendingClientToolInputs(controller);
      conversationOutputItems(event).forEach((item) => emitConversationArtifacts(controller, item?.content ?? item));
      emitConversationTextSnapshot(controller, conversationTextSnapshot(event));
      finish(controller, emittedClientToolInput && !finalTextBuffer ? "tool-calls" : "stop");
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
    providerMetadata?: Record<string, any>,
  ) => {
    if (!toolCallId || !toolName) return;
    emittedClientToolInput = true;
    toolNameById.set(toolCallId, toolName);
    if (providerMetadata) toolProviderMetadataById.set(toolCallId, providerMetadata);
    if (!startedToolCalls.has(toolCallId)) {
      enqueueChunk(controller, { type: "tool-input-start", toolCallId, toolName, providerMetadata: toolProviderMetadataById.get(toolCallId) });
      startedToolCalls.add(toolCallId);
    }

    if (inputTextDelta) {
      toolInputTextById.set(toolCallId, `${toolInputTextById.get(toolCallId) ?? ""}${inputTextDelta}`);
      enqueueChunk(controller, { type: "tool-input-delta", toolCallId, inputTextDelta });
    }

    if (completeInput !== undefined) {
      enqueueChunk(controller, { type: "tool-input-available", toolCallId, toolName, input: completeInput, providerMetadata: toolProviderMetadataById.get(toolCallId) });
      toolInputTextById.delete(toolCallId);
      startedToolCalls.delete(toolCallId);
    }
  };

  const finalizePendingClientToolInputs = (controller: ReadableStreamDefaultController<Uint8Array>) => {
    for (const toolCallId of Array.from(startedToolCalls)) {
      const toolName = toolNameById.get(toolCallId);
      if (!toolName) continue;

      const inputText = toolInputTextById.get(toolCallId) ?? "";
      enqueueChunk(controller, {
        type: "tool-input-available",
        toolCallId,
        toolName,
        input: safeJsonParse(inputText),
        providerMetadata: toolProviderMetadataById.get(toolCallId),
      });
      toolInputTextById.delete(toolCallId);
      startedToolCalls.delete(toolCallId);
    }
  };

  const normalizeToolDeltas = (eventName: string | undefined, event: any, controller: ReadableStreamDefaultController<Uint8Array>) => {
    if (isChatCompletionsEndpoint(endpoint)) {
      for (const choice of event?.choices ?? []) {
        for (const toolCall of choice?.message?.tool_calls ?? []) {
          emitToolInput(
            controller,
            toolCall.id ?? `tool-${toolCall.index ?? startedToolCalls.size}`,
            toolCall.function?.name ?? toolCall.name ?? "unknown_tool",
            undefined,
            safeJsonParse(toolCall.function?.arguments ?? toolCall.arguments ?? {}),
          );
        }

        for (const toolCall of choice?.delta?.tool_calls ?? []) {
          const toolCallId = toolCall.id ?? `tool-${toolCall.index ?? startedToolCalls.size}`;
          const toolName = toolCall.function?.name ?? toolNameById.get(toolCallId) ?? "unknown_tool";
          const argsDelta = typeof toolCall.function?.arguments === "string" ? toolCall.function.arguments : undefined;
          emitToolInput(controller, toolCallId, toolName, argsDelta);
        }

        if (choice?.finish_reason === "tool_calls") {
          finalizePendingClientToolInputs(controller);
        }
      }
      return;
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
    if (closed) return;
    const payload = normalizeProviderPayload(rawPayload);
    if (!payload) return;
    if (payload === "[DONE]") {
      if (endpoint === "/v1/responses") throw new Error("Responses stream ended before response.completed.");
      if (endpoint === "/v1/messages") throw new Error("Messages stream ended before message_stop.");
      finish(controller);
      return;
    }

    if (payload.startsWith("[")) return;

    const parsed = parseJsonPayload(payload);
    if (!parsed || typeof parsed !== "object") {
      if (endpoint === "/v1/messages") throw new Error("Invalid Messages stream event.");
      return;
    }

    rememberMetadata(parsed);
    if (endpoint === "/v1/messages") {
      handleMessagesPayload(parsed, controller, eventName);
      return;
    }
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
      sourceReader = reader;
      try {
        while (!cancelled && !closed) {
          const { done, value } = await reader.read();
          if (cancelled) break;
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

        if (!cancelled && !closed && buffer.trim()) {
          flushEvent(buffer, controller);
        }

        if (!cancelled) {
          if (endpoint === "/v1/responses" && !closed) throw new Error("Responses stream ended before response.completed.");
          if (endpoint === "/v1/messages" && !closed) throw new Error("Messages stream ended before message_stop.");
          finish(controller);
        }
      } catch (err: any) {
        if (!cancelled) enqueueChunk(controller, { type: "error", errorText: err?.message ?? "Generic chat stream failed." });
        closed = true;
      } finally {
        await reader.cancel().catch(() => undefined);
        reader.releaseLock();
        if (!cancelled) controller.close();
      }
    },
    cancel(reason) {
      cancelled = true;
      closed = true;
      return sourceReader?.cancel(reason);
    },
  });
};

export class GenericChatEndpointTransport extends DefaultChatTransport<any> {
  private readonly requestPerformance: WeakMap<ReadableStream<Uint8Array>, DirectChatPerformance>;

  constructor(
    private readonly genericEndpoint: GenericEndpointId,
    private readonly providerKey?: string,
    private readonly providers?: Record<string, Provider>,
    options: ConstructorParameters<typeof DefaultChatTransport<any>>[0] = {},
    private readonly requestModel?: string,
  ) {
    const requestPerformance = new WeakMap<ReadableStream<Uint8Array>, DirectChatPerformance>();
    const fetcher = options.fetch ?? globalThis.fetch;
    super(providerKey ? {
      ...options,
      fetch: async (input, init) => {
        const performance = createDirectChatPerformance();
        const response = await fetcher(input, init);
        if (response.ok && response.body) requestPerformance.set(response.body, performance);
        return response;
      },
    } : options);
    this.requestPerformance = requestPerformance;
  }

  protected processResponseStream(stream: ReadableStream<Uint8Array>): any {
    return super.processResponseStream(createUiMessageChunkStream({
      endpoint: this.genericEndpoint,
      providerKey: this.providerKey,
      source: stream,
      providers: this.providers,
      requestModel: this.requestModel,
      performance: this.requestPerformance.get(stream),
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
        const mappedBody = buildGenericChatEndpointBody(requestEndpoint, rawBody);
        const providerRequestHeaders = rawBody?.providerRequestHeaders && typeof rawBody.providerRequestHeaders === "object"
          ? rawBody.providerRequestHeaders as Record<string, string>
          : undefined;
        const mappedHeaders = new Headers(nextInit?.headers as HeadersInit | undefined);

        Object.entries(providerRequestHeaders ?? {}).forEach(([key, value]) => {
          if (value != null && key.trim()) mappedHeaders.set(key, String(value));
        });

        nextInit = {
          ...(init ?? {}),
          headers: mappedHeaders,
          body: JSON.stringify(mappedBody),
        };
      }
    } catch {
      requestModel = undefined;
    }

    const performance = providerKey ? createDirectChatPerformance() : undefined;
    const response = await fetcher(input, nextInit);
    if (!response.ok || !response.body) return response;

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Content-Type", "text/event-stream");
    responseHeaders.set("Cache-Control", "no-cache");
    responseHeaders.delete("Content-Length");
    responseHeaders.delete("Content-Encoding");
    return new Response(createUiMessageChunkStream({ endpoint: requestEndpoint, providerKey, source: response.body, requestModel, providers, performance }), {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  };
}
