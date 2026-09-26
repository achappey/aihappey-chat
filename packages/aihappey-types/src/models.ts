import type { IconToken } from "./theme/IconToken";

/** Display metadata for model-type UI only; model.type remains the backend value. */
export const getModelTypeLabelKey = (type: string): string =>
  type === "audio" ? "realtime" : type;

const MODEL_TYPE_ICONS: Record<string, IconToken> = {
  language: "language",
  embedding: "embedding",
  image: "image",
  audio: "realtime",
  transcription: "transcription",
  speech: "speech",
  reranking: "reranking",
  video: "video",
};

export const getModelTypeIcon = (type: string): IconToken | undefined =>
  MODEL_TYPE_ICONS[type];

export interface ModelResponse {
  data: ModelOption[];
}

export interface ModelOption {
  id: string;
  name: string;
  /** User-facing model id. Internal route markers must not be exposed in UI or copied values. */
  displayId?: string;
  type: string;
  description?: string;
  created?: number;
  context_window?: number;
  max_tokens?: number;
  owned_by: string;
  tags: string[];
  pricing?: ModelPricing
  /** Runtime route used by the chat app. Omitted means legacy/gateway. */
  route?: "gateway" | "direct";
  /** Provider key that owns this model, independent from route-specific display ids. */
  providerKey?: string;
  /** Provider key returned by a direct provider model request. */
  sourceProviderKey?: string;
  /** Original model id returned by the upstream `/v1/models` response. */
  providerModelId?: string;
}

export interface ModelPricing {
  input: string | number;
  output: string | number;
  input_cache_read?: string | number;
  input_cache_write?: string | number;
}
