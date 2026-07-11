export type LocalDoc = {
  id: string;
  fileName: string;
  text: string;
  /** original file payload (for download). Not sent to backend. */
  file: File;
  /** original index in the rerank request */
  index: number;
  /** 1-based rank, populated after rerank */
  rank?: number;
  relevanceScore?: number;
};

export type RerankingResponse = {
  ranking: { index: number; relevanceScore: number }[];
  warnings?: unknown[];
  providerMetadata?: Record<string, any>;
  response?: {
    timestamp?: Date | number | string;
    modelId?: string;
    id?: string;
    body?: unknown;
    [key: string]: unknown;
  };
};

