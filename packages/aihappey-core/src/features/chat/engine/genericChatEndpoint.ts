import type { ChatEndpointId } from "aihappey-state";
import type { Provider } from "aihappey-types";
import { extractPlaygroundStreamText } from "../../playground/playgroundChat";
import { buildGenericChatEndpointBody, type GenericEndpointId } from "./genericEndpointMappers";

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
  endpoint === "/v1/chat/completions" || endpoint === "/v1/responses" || endpoint === "/v1/messages";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const resolveGenericChatEndpointUrl = (baseUrl: string, endpoint: GenericEndpointId) => {
  const base = trimTrailingSlash(baseUrl || "");
  return `${base}${endpoint}`;
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

  if (path.endsWith("/v1/chat/completions")) return "/v1/chat/completions";
  if (path.endsWith("/v1/responses")) return "/v1/responses";
  if (path.endsWith("/v1/messages")) return "/v1/messages";
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

  return extractPlaygroundStreamText(endpoint, event);
};

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
  let latestGateway: any | undefined;
  let totalTokens: number | undefined;
  let finalTextBuffer = "";
  const startedToolCalls = new Set<string>();
  const emittedToolOutputs = new Set<string>();
  const activeReasoningIds = new Set<string>();
  const closedReasoningIds = new Set<string>();
  const reasoningTextById = new Map<string, string>();
  const reasoningProviderMetadataById = new Map<string, Record<string, any>>();
  const emittedSourceKeys = new Set<string>();

  const enqueueChunk = (controller: ReadableStreamDefaultController<Uint8Array>, chunk: any) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
  };

  const messageMetadata = () => ({
    model: latestModel,
    modelId: latestModel,
    selectedModel: latestModel,
    author: latestModel,
    endpoint,
    totalTokens,
    usage: latestUsage,
    gateway: latestGateway,
    timestamp: new Date().toISOString(),
  });

  const resolveProvider = () => {
    const resolvedProviderKey = normalizeProviderKey(providerKey) ?? providerKeyFromModel(latestModel ?? requestModel);
    return resolvedProviderKey ? providers?.[resolvedProviderKey] : undefined;
  };

  const resolveProviderKey = () => normalizeProviderKey(providerKey) ?? providerKeyFromModel(latestModel ?? requestModel);

  const createReasoningProviderMetadata = (item?: any) => {
    const encryptedContent = item?.encrypted_content;
    const resolvedProviderKey = resolveProviderKey();
    if (!resolvedProviderKey || typeof encryptedContent !== "string" || !encryptedContent) return undefined;
    return {
      [resolvedProviderKey]: {
        encrypted_content: encryptedContent,
      },
    };
  };

  const rememberReasoningMetadata = (id: string, item?: any) => {
    const providerMetadata = createReasoningProviderMetadata(item);
    if (!providerMetadata) return undefined;
    reasoningProviderMetadataById.set(id, providerMetadata);
    return providerMetadata;
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

  const finish = (controller: ReadableStreamDefaultController<Uint8Array>) => {
    if (closed) return;
    if (endpoint === "/v1/responses") {
      ensureMessageStarted(controller);
      for (const reasoningId of Array.from(activeReasoningIds)) {
        closeReasoning(controller, reasoningId);
      }
      closeText(controller);
      if (startedStep) enqueueChunk(controller, { type: "finish-step" });
    } else {
      ensureStarted(controller);
      closeText(controller);
      enqueueChunk(controller, { type: "finish-step" });
    }
    enqueueChunk(controller, {
      type: "finish",
      finishReason: "stop",
      messageMetadata: messageMetadata(),
    });
    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
    closed = true;
  };

  const rememberMetadata = (event: any) => {
    if (!event || typeof event !== "object") return;
    latestModel = event.model ?? event.message?.model ?? event.response?.model ?? latestModel;
    const usage = event.usage ?? event.message?.usage ?? event.response?.usage;
    if (usage) latestUsage = usage;
    const responseGateway = event.metadata?.gateway ?? event.response?.metadata?.gateway;
    const currentGateway = responseGateway ?? latestGateway;
    const providerGateway = resolveProvider()?.createGatewayMetadata?.({
      event,
      endpoint,
      requestModel: latestModel ?? requestModel,
      currentGateway,
    });
    latestGateway = providerGateway ?? currentGateway;
    const inputTokens = usage?.input_tokens ?? usage?.prompt_tokens;
    const outputTokens = usage?.output_tokens ?? usage?.completion_tokens;
    const providedTotal = usage?.total_tokens;
    totalTokens = typeof providedTotal === "number"
      ? providedTotal
      : typeof inputTokens === "number" || typeof outputTokens === "number"
        ? (inputTokens ?? 0) + (outputTokens ?? 0)
        : totalTokens;
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

    if (type === "response.content_part.added" && event?.part?.type === "reasoning_text") {
      const id = responseReasoningId(event);
      ensureReasoning(controller, id);
      if (typeof event?.part?.text === "string" && event.part.text) {
        emitReasoningDelta(controller, id, event.part.text);
      }
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
      (event?.part?.annotations ?? []).forEach((annotation: any, index: number) => emitSource(controller, annotation, index));
      return;
    }

    if (type === "response.completed") {
      rememberMetadata(event);
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
    if (endpoint === "/v1/chat/completions") {
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

    if (endpoint === "/v1/chat/completions") {
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

    normalizeToolDeltas(eventName, parsed, controller);
    const delta = getTextDelta(eventName, parsed);
    if (!delta) return;
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
    const requestEndpoint = getEndpointFromRequestInput(input);
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
