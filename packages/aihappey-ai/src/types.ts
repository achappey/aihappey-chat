import type { SharedV3Warning, ImageModelV3ProviderMetadata, ImageModelV3Usage } from "@ai-sdk/provider"

export interface AiChatConfig {
  api?: string;
  getAccessToken?: () => Promise<string>;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}

export interface ImageResponse {
  images: string[] | Uint8Array<ArrayBufferLike>[];
  warnings: Array<SharedV3Warning>;
  providerMetadata?: ImageModelV3ProviderMetadata;
  response: {
    timestamp: Date;
    modelId: string;
    headers: Record<string, string> | undefined;
  };
  usage?: ImageModelV3Usage;
}


