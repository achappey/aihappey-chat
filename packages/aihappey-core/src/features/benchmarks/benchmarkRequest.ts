import { DefaultChatTransport } from "aihappey-ai";
import { getModelProviderKey, resolveDirectEndpointProfileForModel,
  resolveEndpointProfileProviderConfig, resolveEndpointProfileProviderHeaders,
  resolveEndpointProfileRequestMetadata, resolveEndpointProfileRequestProviderHeaders,
  splitEndpointProfileProviderConfig } from "../chat/engine/endpointProfiles";
import { createChatRouteHeaders } from "../chat/engine/chatRouteHeaders";
import { GenericChatEndpointTransport, isGenericChatEndpoint } from "../chat/engine/genericChatEndpoint";
import { buildGenericChatEndpointBody } from "../chat/engine/genericEndpointMappers";
import { createAuthFetch } from "../chat/engine/useAuthFetch";
import { validateBenchmarkSnapshot } from "./benchmarkRouting";
import type { BenchmarkEnvironment, BenchmarkMetrics, BenchmarkTargetSnapshot } from "./types";

const validMetric = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

/** Read only existing adapter/backend metrics; never infer tokens or measure a second clock. */
export function benchmarkMetrics(metadata: any): BenchmarkMetrics {
  const gateway = metadata?.providerMetadata?.gateway;
  return {
    ...(validMetric(gateway?.ttft) ? { ttft: gateway.ttft } : {}),
    ...(validMetric(gateway?.tps) ? { tps: gateway.tps } : {}),
  };
}

/** Abort even when an injected fetch ignores its signal; cancel a late-arriving stream. */
function waitForStream<T extends ReadableStream<any>>(pending: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    pending.then(stream => {
      if (signal.aborted) { void stream.cancel().catch(() => {}); return; }
      resolve(stream);
    }, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}

export async function executeBenchmarkRequest({ target, prompt, env, signal, onMetrics }: {
  target: BenchmarkTargetSnapshot;
  prompt: string;
  env: BenchmarkEnvironment;
  signal: AbortSignal;
  onMetrics: (metrics: BenchmarkMetrics) => void;
}): Promise<void> {
  signal.throwIfAborted();
  validateBenchmarkSnapshot(target, env);
  const direct = target.mode === "direct";
  const profile = direct ? resolveDirectEndpointProfileForModel({
    modelId: target.modelId, model: target.model, selectedChatEndpoint: target.endpoint, providers: env.providers,
  }) : undefined;
  const key = getModelProviderKey(target.modelId, target.model);
  const settings = structuredClone(target.settings);
  const activeMetadata = key && settings.providerMetadata[key] !== undefined
    ? { [key]: settings.providerMetadata[key] } : undefined;
  const providerMetadata = resolveEndpointProfileRequestMetadata({
    activeProviderMetadata: activeMetadata, providerMetadata: settings.providerMetadata,
    endpointProfile: profile, fallbackProviderMetadataEnabled: true,
  });
  const providerHeaders = resolveEndpointProfileRequestProviderHeaders({
    providerHeaders: settings.providerHeaders, endpointProfile: profile, selectedModelProviderKey: key,
  });
  const providerConfig = resolveEndpointProfileProviderConfig({ providerMetadata: settings.providerMetadata, endpointProfile: profile });
  const { body: providerRequestConfig, headers: providerRequestHeaders } =
    splitEndpointProfileProviderConfig(providerConfig, target.providerKey, target.endpoint);
  const directProviderHeaders = resolveEndpointProfileProviderHeaders({ providerHeaders: settings.providerHeaders, endpointProfile: profile });
  const headers = createChatRouteHeaders({
    configuredHeaders: env.config.headers, customHeaders: env.customHeaders, modelId: target.modelId,
    directProviderKey: target.providerKey, endpoint: target.endpoint, authenticated: !!env.config.getAccessToken,
    providers: env.providers, providerHeaders: directProviderHeaders, providerRequestHeaders,
  });
  if (!direct) {
    for (const values of Object.values(providerHeaders ?? {})) Object.assign(headers, values);
  }
  const fetcher = createAuthFetch({
    chatMode: "chat", getAccessToken: env.config.getAccessToken, customHeaders: headers,
    customFetch: env.config.fetch, directBaseUrl: direct ? target.baseUrl : undefined,
  }) ?? env.config.fetch ?? fetch;
  const genericEndpoint = isGenericChatEndpoint(target.endpoint) ? target.endpoint : undefined;
  const options = {
    api: `${target.baseUrl.replace(/\/+$/, "")}${target.endpoint}`,
    fetch: fetcher,
    prepareSendMessagesRequest: (opts: any) => {
      signal.throwIfAborted();
      const body = {
        id: opts.chatId ?? opts.id, model: target.requestModel, messages: opts.messages,
        trigger: opts.trigger, messageId: opts.messageId,
        temperature: settings.temperature, maxOutputTokens: settings.maxOutputTokens, tools: [],
        providerMetadata, providerHeaders,
        ...(direct ? {
          providerRequestConfig, providerRequestConfigProviderKey: target.providerKey,
          providerRequestHeaders: directProviderHeaders, omitProviderMetadataInNativeMetadata: true,
        } : {}),
      };
      return {
        body: genericEndpoint ? buildGenericChatEndpointBody(genericEndpoint, body) : body,
        headers: genericEndpoint ? { Accept: "text/event-stream" } : undefined,
      };
    },
  };
  const transport = genericEndpoint
    ? new GenericChatEndpointTransport(genericEndpoint, target.providerKey, env.providers, options, target.requestModel)
    : new DefaultChatTransport(options);
  const stream = await waitForStream(transport.sendMessages({
    chatId: crypto.randomUUID(), trigger: "submit-message", messageId: undefined, abortSignal: signal,
    messages: [{ id: crypto.randomUUID(), role: "user", parts: [{ type: "text", text: prompt }] }],
  }), signal);
  signal.throwIfAborted();
  const reader = stream.getReader();
  let cancellation: Promise<void> | undefined;
  const cancel = () => cancellation ??= reader.cancel().catch(() => {});
  const abort = () => { void cancel(); };
  signal.addEventListener("abort", abort, { once: true });
  let finished = false;
  try {
    signal.throwIfAborted();
    while (true) {
      const { done, value: chunk } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      if (chunk.type === "error") throw new Error(chunk.errorText || "The stream reported an error.");
      if (chunk.type === "abort") throw new Error("The provider aborted the stream.");
      if ("messageMetadata" in chunk && chunk.messageMetadata) onMetrics(benchmarkMetrics(chunk.messageMetadata));
      if (chunk.type === "finish") {
        if (["error", "failed", "cancelled", "incomplete"].includes(chunk.finishReason ?? "")) {
          throw new Error(`The stream ended with ${chunk.finishReason}.`);
        }
        finished = true;
      }
    }
    if (!finished) throw new Error("The stream closed without a completion event.");
  } finally {
    signal.removeEventListener("abort", abort);
    await cancel();
    reader.releaseLock();
  }
}

export function redactBenchmarkError(error: unknown, env: BenchmarkEnvironment, target?: BenchmarkTargetSnapshot) {
  let message = error instanceof Error ? error.message : "The benchmark request failed.";
  const values = [...Object.values(env.config.headers ?? {}), ...Object.values(env.customHeaders ?? {}),
    ...Object.values(target?.settings.providerHeaders ?? {}).flatMap(headers => Object.values(headers))];
  // Headers can contain provider secrets as well as ordinary request settings. Do not render either in errors.
  const collectHeaders = (value: any) => {
    if (!value || typeof value !== "object") return;
    if (value.headers && typeof value.headers === "object") values.push(...Object.values(value.headers).filter((item): item is string => typeof item === "string"));
  };
  Object.values(target?.settings.providerMetadata ?? {}).forEach(collectHeaders);
  for (const value of values.sort((a, b) => b.length - a.length)) {
    for (const secret of [value, value.replace(/^Bearer\s+/i, "")]) {
      if (secret.trim()) message = message.split(secret).join("[redacted]");
    }
  }
  return message;
}
