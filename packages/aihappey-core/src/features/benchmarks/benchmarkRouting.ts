import type { ChatEndpointId } from "aihappey-state";
import { stripHiddenDirectModelIdSuffix } from "aihappey-types";
import {
  GATEWAY_CHAT_ENDPOINT_IDS, getModelProviderKey, resolveChatRoute,
  resolveDirectEndpointProfileForModel, resolveProviderRequestModelId,
} from "../chat/engine/endpointProfiles";
import { mergeCredentialHeaders } from "../provider-credentials/providerAuthHeaders";
import type { BenchmarkEnvironment, BenchmarkTarget, BenchmarkTargetSnapshot } from "./types";

export const benchmarkGatewayAvailable = (env: BenchmarkEnvironment) =>
  !!env.config.baseUrl?.trim() && (!!env.config.getAccessToken
    || (env.config.gatewayEnabled !== false && env.gatewayEnabled !== false));

export function benchmarkEndpoints(target: BenchmarkTarget, env: BenchmarkEnvironment): ChatEndpointId[] {
  if (target.mode === "default") return [...GATEWAY_CHAT_ENDPOINT_IDS];
  if (env.config.getAccessToken) return [];
  const model = env.models.find(item => item.id === target.modelId);
  return resolveDirectEndpointProfileForModel({ modelId: target.modelId, model, providers: env.providers })?.chatEndpoints ?? [];
}

/** Chat may recover with a fallback. A benchmark must never measure that fallback. */
export function resolveBenchmarkTarget(target: BenchmarkTarget, env: BenchmarkEnvironment): BenchmarkTargetSnapshot {
  const model = env.models.find(item => item.id === target.modelId);
  if (!model || model.type !== "language") throw new Error("Select an available language model.");
  if (target.mode !== "default" && target.mode !== "direct") throw new Error("Select Gateway or direct routing.");
  if (target.mode === "direct" && env.config.getAccessToken) {
    throw new Error("Azure authentication supports Gateway endpoints only. Direct access is unavailable.");
  }
  if (target.mode === "default" && !benchmarkGatewayAvailable(env)) throw new Error("The Gateway is unavailable or disabled.");
  if (target.mode === "default" && model.route === "direct") {
    throw new Error("This model is only available through direct discovery. Select a Gateway model or use direct routing.");
  }
  if (!benchmarkEndpoints(target, env).includes(target.endpoint)) {
    throw new Error("The selected endpoint is not supported by this target. Select a supported endpoint explicitly.");
  }
  const route = resolveChatRoute({
    mode: target.mode, selectedChatEndpoint: target.endpoint, modelId: target.modelId, model,
    providers: env.providers, customHeaders: mergeCredentialHeaders(env.config.headers, env.customHeaders),
    authenticated: !!env.config.getAccessToken, gatewayEnabled: benchmarkGatewayAvailable(env),
  });
  if (!route.available || route.mode !== target.mode || route.endpoint !== target.endpoint) {
    throw new Error("The exact selected route is unavailable. Check the provider API key and endpoint; no fallback will be used.");
  }
  const direct = target.mode === "direct";
  const baseUrl = (direct ? route.endpointProfile?.apiBaseUrl : env.config.baseUrl)?.trim();
  if (!baseUrl) throw new Error("The selected endpoint has no base URL.");
  const providerKey = direct ? getModelProviderKey(target.modelId, model) : undefined;
  const displayId = model.displayId ?? stripHiddenDirectModelIdSuffix(model.id);
  const name = model.name === model.id ? displayId : model.name;
  return {
    ...structuredClone(target), model: structuredClone(model),
    modelLabel: name && name !== displayId ? `${name} (${displayId})` : displayId,
    baseUrl, providerKey,
    requestModel: direct ? resolveProviderRequestModelId({ modelId: target.modelId, model, providerKey }) : model.id,
  };
}

export function validateBenchmarkSnapshot(target: BenchmarkTargetSnapshot, env: BenchmarkEnvironment) {
  const current = resolveBenchmarkTarget(target, env);
  if (current.baseUrl !== target.baseUrl || current.providerKey !== target.providerKey || current.requestModel !== target.requestModel) {
    throw new Error("The selected target route has changed since this batch was captured. Start a new batch instead.");
  }
}
