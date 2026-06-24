import type { ChatEndpointId } from "aihappey-state";
import { extractPlaygroundStreamText } from "../../playground/playgroundChat";
import { buildGenericChatEndpointBody, type GenericEndpointId } from "./genericEndpointMappers";

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
  source,
  requestModel,
}: {
  endpoint: GenericEndpointId;
  source: ReadableStream<Uint8Array>;
  requestModel?: string;
}): ReadableStream<Uint8Array> => {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const textPartId = "text-1";
  const messageId = `generic-${endpoint.replace(/[^a-z0-9]+/gi, "-")}-${Date.now()}`;
  let buffer = "";
  let startedText = false;
  let closed = false;
  let latestModel: string | undefined = requestModel;
  let totalTokens: number | undefined;
  const startedToolCalls = new Set<string>();

  const enqueueChunk = (controller: ReadableStreamDefaultController<Uint8Array>, chunk: any) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
  };

  const ensureStarted = (controller: ReadableStreamDefaultController<Uint8Array>) => {
    if (startedText) return;
    enqueueChunk(controller, {
      type: "start",
      messageId,
      messageMetadata: {
        model: latestModel,
        modelId: latestModel,
        selectedModel: latestModel,
        author: latestModel,
        endpoint,
        timestamp: new Date().toISOString(),
      },
    });
    enqueueChunk(controller, { type: "start-step" });
    enqueueChunk(controller, { type: "text-start", id: textPartId });
    startedText = true;
  };

  const finish = (controller: ReadableStreamDefaultController<Uint8Array>) => {
    if (closed) return;
    ensureStarted(controller);
    enqueueChunk(controller, { type: "text-end", id: textPartId });
    enqueueChunk(controller, { type: "finish-step" });
    enqueueChunk(controller, {
      type: "finish",
      finishReason: "stop",
      messageMetadata: {
        model: latestModel,
        modelId: latestModel,
        selectedModel: latestModel,
        author: latestModel,
        endpoint,
        totalTokens,
        timestamp: new Date().toISOString(),
      },
    });
    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
    closed = true;
  };

  const rememberMetadata = (event: any) => {
    if (!event || typeof event !== "object") return;
    latestModel = event.model ?? event.message?.model ?? event.response?.model ?? latestModel;
    const usage = event.usage ?? event.message?.usage ?? event.response?.usage;
    const inputTokens = usage?.input_tokens ?? usage?.prompt_tokens;
    const outputTokens = usage?.output_tokens ?? usage?.completion_tokens;
    const providedTotal = usage?.total_tokens;
    totalTokens = typeof providedTotal === "number"
      ? providedTotal
      : typeof inputTokens === "number" || typeof outputTokens === "number"
        ? (inputTokens ?? 0) + (outputTokens ?? 0)
        : totalTokens;
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

    const parsed = parseJsonPayload(payload);
    if (!parsed || typeof parsed !== "object") return;

    rememberMetadata(parsed);
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
}: {
  endpoint: GenericEndpointId;
  fetcher: typeof fetch;
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

    return new Response(createUiMessageChunkStream({ endpoint: requestEndpoint, source: response.body, requestModel }), {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  };
}
