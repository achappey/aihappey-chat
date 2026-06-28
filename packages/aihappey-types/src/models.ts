
export interface ModelResponse {
  data: ModelOption[];
}

export interface ModelOption {
  id: string;
  name: string;
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
  input: string;
  output: string;
  input_cache_read?: string;
}
