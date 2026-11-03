import type { Agent, RemoteAgentModel } from "aihappey-types";
import { createEndpointHeaders } from "../provider-credentials/providerAuthHeaders";
import { buildSelectedAgentRequest } from "./agentSelection";

export type AgentDetailConfig = {
  agentEndpoint?: string;
  endpoints: { models?: string };
  getAgentAccessToken?: () => Promise<string>;
  agentScopes?: string[];
  headers?: Record<string, string>;
  fetch?: typeof fetch;
};

const maxDocumentBytes = 96 * 1024 * 1024;
const maxCacheBytes = 32 * 1024 * 1024;
type Entry = { promise: Promise<Agent>; expires: number; bytes: number };
type Cache = { scope: string; fetcher: typeof fetch; entries: Map<string, Entry> };
// Catalog replacement (including account changes) invalidates the cache without persisting definitions.
const caches = new WeakMap<readonly RemoteAgentModel[], Cache>();

export const remoteAgentDetailUrl = (modelsApi: string, id: string) => {
  const url = new URL(modelsApi);
  url.pathname = `${url.pathname.replace(/\/$/, "")}/${encodeURIComponent(id)}`;
  return url.toString();
};

const readDocument = async (response: Response, signal?: AbortSignal) => {
  if (Number(response.headers.get("content-length")) > maxDocumentBytes) throw new Error("Agent definition exceeds the download size limit.");
  if (!response.body) throw new Error("The model detail response is empty.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      signal?.throwIfAborted();
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxDocumentBytes) throw new Error("Agent definition exceeds the download size limit.");
      text += decoder.decode(value, { stream: true });
    }
    return { value: JSON.parse(text + decoder.decode()), bytes };
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally { reader.releaseLock(); }
};

/** Fetch only for a concrete operation. Download refreshes bypass completed cache entries. */
export async function getRemoteAgentDefinition(
  config: AgentDetailConfig,
  customHeaders: Record<string, string>,
  catalog: readonly RemoteAgentModel[],
  id: string,
  options: { signal?: AbortSignal; refresh?: boolean } = {},
): Promise<Agent> {
  const model = catalog.find(model => model.id === id);
  if (!model || !config.agentEndpoint) throw new Error(`Remote agent '${id}' is unavailable.`);
  options.signal?.throwIfAborted();
  const token = await config.getAgentAccessToken?.();
  options.signal?.throwIfAborted();
  const headers = createEndpointHeaders({ ...config.headers, ...customHeaders });
  if (token) headers.Authorization = `Bearer ${token}`;
  const api = `${config.agentEndpoint}${config.endpoints.models ?? "/v1/models"}`;
  const fetcher = config.fetch ?? fetch;
  const scope = JSON.stringify([api, headers]);
  let cache = caches.get(catalog);
  if (!cache || cache.scope !== scope || cache.fetcher !== fetcher) {
    cache = { scope, fetcher, entries: new Map() };
    caches.set(catalog, cache);
  }
  let entry = cache.entries.get(id);
  if (entry && (entry.expires <= Date.now() || (options.refresh && entry.bytes > 0))) {
    cache.entries.delete(id);
    entry = undefined;
  }
  if (!entry) {
    const owner = cache;
    const next: Entry = { expires: Date.now() + 5 * 60_000, bytes: 0, promise: undefined! };
    next.promise = (async () => {
      // The shared request is not owned by a single caller's abort signal.
      const response = await fetcher(remoteAgentDetailUrl(api, id), { headers });
      if (!response.ok) {
        // An older server may not implement detail yet. Never fall back for new summary catalogs.
        if (response.status === 404 && model.agent) return structuredClone(model.agent);
        throw new Error(`Unable to load remote agent '${id}' (${response.status}).`);
      }
      const { value, bytes } = await readDocument(response);
      if (typeof value?.id !== "string" || value.id.toLowerCase() !== id.toLowerCase()
        || !value.agent || typeof value.agent !== "object" || Array.isArray(value.agent)
        || typeof value.agent.name !== "string" || typeof value.agent.instructions !== "string") {
        throw new Error(`The model detail for '${id}' does not contain a valid agent definition.`);
      }
      next.bytes = bytes;
      if (bytes > maxCacheBytes) owner.entries.delete(id);
      else {
        let total = Array.from(owner.entries.values()).reduce((sum, item) => sum + item.bytes, 0);
        for (const [key, item] of owner.entries) {
          if (total <= maxCacheBytes && owner.entries.size <= 32) break;
          if (key !== id && item.bytes > 0) { owner.entries.delete(key); total -= item.bytes; }
        }
      }
      return value.agent as Agent;
    })().catch(error => {
      if (owner.entries.get(id) === next) owner.entries.delete(id);
      throw error;
    });
    owner.entries.set(id, next);
    entry = next;
  }
  const result = await waitForAgent(entry.promise, options.signal);
  // Do not return a result across a concurrent endpoint/account/auth scope change.
  if (caches.get(catalog) !== cache) throw new Error("The remote agent configuration changed. Retry the operation.");
  return structuredClone(result);
}

function waitForAgent(promise: Promise<Agent>, signal?: AbortSignal): Promise<Agent> {
  if (!signal) return promise;
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
    signal.addEventListener("abort", abort, { once: true });
    promise.then(value => { signal.removeEventListener("abort", abort); if (!signal.aborted) resolve(value); }, error => {
      signal.removeEventListener("abort", abort); reject(error);
    });
  });
}

export async function loadRemoteAgentModels(config: AgentDetailConfig, customHeaders: Record<string, string>,
  catalog: RemoteAgentModel[], ids: string[], signal?: AbortSignal): Promise<RemoteAgentModel[]> {
  const selected = new Set(ids);
  return Promise.all(catalog.map(async model => selected.has(model.id) && !model.agent
    ? { ...model, agent: await getRemoteAgentDefinition(config, customHeaders, catalog, model.id, { signal }) }
    : model));
}

export async function prepareSelectedAgentRequest(config: AgentDetailConfig, customHeaders: Record<string, string>,
  selected: string[], agents: Agent[], catalog: RemoteAgentModel[],
  options?: { workflowType?: string; managerAgentKey?: string }, signal?: AbortSignal) {
  let request = buildSelectedAgentRequest(selected, agents, catalog, options);
  const mixed = options?.workflowType === "magentic" && request.entries.some(entry => entry.kind === "local")
    && request.entries.some(entry => entry.kind === "remote");
  if (mixed || (!config.getAgentAccessToken && !config.agentScopes?.length)) {
    const hydrated = await loadRemoteAgentModels(config, customHeaders, catalog,
      request.entries.filter(entry => entry.kind === "remote").map(entry => entry.backendId), signal);
    request = buildSelectedAgentRequest(selected, agents, hydrated, options);
  }
  if (request.error) throw new Error(request.error);
  return request;
}
