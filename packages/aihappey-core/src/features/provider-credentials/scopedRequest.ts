import { store } from "aihappey-state";
import { getAgentCredentialModels } from "aihappey-types";
import { getProviderRegistry } from "../../runtime/providers/useProviderRegistry";
import { buildOperationHeaders as buildHeaders, scopeHeadersForModels } from "./providerAuthHeaders";

export const buildOperationHeaders = (
  config: Parameters<typeof buildHeaders>[0],
  customHeaders?: Record<string, string>,
  modelIds?: string | readonly string[],
  ignoreTokenErrors = false,
) => buildHeaders(config, customHeaders, modelIds, getProviderRegistry(store.getState().customProviders), ignoreTokenErrors);

export const scopeOperationHeaders = (headers: Record<string, string> | undefined, modelIds?: string | readonly string[]) =>
  scopeHeadersForModels(headers, modelIds, getProviderRegistry(store.getState().customProviders));

/** Only request routing fields may select credentials, never arbitrary metadata. */
export const requestCredentialModels = (body: any, remoteModels: any[] = []): string[] => {
  const models: string[] = [];
  const add = (value: unknown) => {
    if (typeof value !== "string" || !value.trim()) return;
    const remote = remoteModels.find(item => item.id === value);
    if (remote) {
      for (const model of getAgentCredentialModels(remote.agent)) models.push(model.id);
    } else if (value.includes("/")) models.push(value);
  };
  add(body?.model);
  for (const model of Array.isArray(body?.models) ? body.models : []) add(model);
  for (const agent of [
    ...(Array.isArray(body?.agents) ? body.agents : []),
    ...(Array.isArray(body?.metadata?.agents) ? body.metadata.agents : []),
  ]) for (const model of getAgentCredentialModels(agent)) add(model.id);
  return models;
};

/** Final-boundary filtering also catches credentials in static or SDK headers. */
export const createCredentialScopedFetch = (fetcher: typeof fetch = fetch): typeof fetch =>
  async (input, init) => {
    const state = store.getState();
    const headers = new Headers(typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined);
    new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
    let body: any;
    try {
      const source = init?.body ?? (typeof Request !== "undefined" && input instanceof Request ? await input.clone().text() : undefined);
      if (typeof source === "string") body = JSON.parse(source);
      else if (typeof FormData !== "undefined" && source instanceof FormData) body = { model: source.get("model") };
    } catch { /* Unresolved routing fails closed, without changing the payload. */ }
    const scoped = scopeHeadersForModels(
      Object.fromEntries(headers.entries()),
      requestCredentialModels(body, state.remoteAgentModels),
      getProviderRegistry(state.customProviders),
    );
    return fetcher(input, { ...init, headers: scoped });
  };
