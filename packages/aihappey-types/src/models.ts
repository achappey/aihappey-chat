
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
}

export interface ModelPricing {
  input: string;
  output: string;
  input_cache_read?: string;
}