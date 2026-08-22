import type { ChatConfig } from "../chat/context/ChatProvider";

export const createVectorStoreEmbeddingClient = (
  config: ChatConfig,
  customHeaders?: Record<string, string>,
) => async (model: string, values: string[], signal?: AbortSignal): Promise<number[][]> => {
  if (!config?.baseUrl) throw new Error("The embeddings gateway is not configured.");
  if (!model.trim()) throw new Error("An embedding model is required.");
  if (!values.length) return [];
  const headers = new Headers({
    "Content-Type": "application/json",
    ...(config.headers ?? {}),
    ...(customHeaders ?? {}),
  });
  if (config.getAccessToken) {
    const token = await config.getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  const endpoint = (config.endpoints as any)?.embeddings ?? "/api/embeddings";
  const response = await (config.fetch ?? fetch)(`${config.baseUrl}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ model, values }),
    signal,
  });
  if (!response.ok) throw new Error(`Embedding failed (${await response.text()})`);
  const payload = await response.json() as { embeddings?: unknown };
  if (!Array.isArray(payload.embeddings) || payload.embeddings.length !== values.length) {
    throw new Error("The embeddings endpoint returned an unexpected number of vectors.");
  }
  const embeddings = payload.embeddings.map((value) => {
    if (!Array.isArray(value) || !value.length || value.some((number) => typeof number !== "number" || !Number.isFinite(number))) {
      throw new Error("The embeddings endpoint returned an invalid vector.");
    }
    return value as number[];
  });
  const dimension = embeddings[0].length;
  if (embeddings.some((embedding) => embedding.length !== dimension)) {
    throw new Error("The embeddings endpoint returned vectors with inconsistent dimensions.");
  }
  return embeddings;
};
