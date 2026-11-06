/** Portable model documents. Storage never projects away unknown JSON fields. */
export interface CatalogModel {
  id: string;
  type?: string;
}

export interface CatalogResponse<T extends CatalogModel = CatalogModel> {
  data: T[];
}

export interface ModelCatalogSnapshot<T extends CatalogModel = CatalogModel> {
  version: 1;
  sources: Record<string, { updatedAt: number; response: CatalogResponse<T> }>;
}

export interface LocalModelStore {
  readonly kind: "indexeddb";
  load<T extends CatalogModel>(scope: string): Promise<ModelCatalogSnapshot<T> | undefined>;
  replace<T extends CatalogModel>(scope: string, snapshot: ModelCatalogSnapshot<T>): Promise<void>;
  clear(scope: string): Promise<void>;
}

export const MAX_CATALOG_CHARACTERS = 32 * 1024 * 1024;

export const isCatalogResponse = (value: unknown): value is CatalogResponse => {
  if (!value || typeof value !== "object" || !Array.isArray((value as CatalogResponse).data)) return false;
  return (value as CatalogResponse).data.every(model => model && typeof model === "object"
    && typeof model.id === "string" && model.id.trim().length > 0);
};

/** Invalid/unsupported snapshots are cache misses, not empty authoritative catalogs. */
export function readModelSnapshot<T extends CatalogModel>(value: unknown): ModelCatalogSnapshot<T> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const snapshot = value as ModelCatalogSnapshot<T>;
  if (snapshot.version !== 1 || !snapshot.sources || typeof snapshot.sources !== "object" || Array.isArray(snapshot.sources)) return undefined;
  const entries = Object.entries(snapshot.sources);
  if (entries.length > 512 || entries.some(([source, entry]) => !source || !entry
    || !Number.isFinite(entry.updatedAt) || entry.updatedAt < 0 || !isCatalogResponse(entry.response))) return undefined;
  return snapshot;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}

/** Only the digest is stored. Tokens/API keys must never appear in cache keys or snapshots. */
export async function modelCacheScope(context: {
  endpoint: string;
  authenticated: boolean;
  identity?: string;
  gatewayEnabled: boolean;
  headers?: Record<string, string>;
  providers?: Record<string, { name?: string; apiBaseUrl?: string }>;
}): Promise<string | undefined> {
  if (context.authenticated && !context.identity?.trim()) return undefined;
  if (!globalThis.crypto?.subtle) return undefined;
  const headers = Object.fromEntries(new Headers(context.headers).entries());
  const providers = Object.fromEntries(Object.entries(context.providers ?? {})
    .map(([key, provider]) => [key, { name: provider.name ?? "", apiBaseUrl: provider.apiBaseUrl ?? "" }]));
  const bytes = new TextEncoder().encode(JSON.stringify(canonical({ ...context, headers, providers })));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}
