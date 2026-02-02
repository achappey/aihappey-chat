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

export interface VideoResponse {
  videos: VideoResponseFile[];
  warnings: Array<SharedV3Warning>;
  providerMetadata?: Record<string, any>;
  response: {
    timestamp: Date;
    modelId: string;
    headers: Record<string, string> | undefined;
  };
}

export interface VideoResponseFile {
  type: "base64";
  data: string
  mimeType: string
}

export interface TranscriptionResponse {
  text: string;
  segments: Array<{
    text: string;
    startSecond: number;
    endSecond: number;
  }>;
  language: string | undefined;
  durationInSeconds: number | undefined;
  warnings: Array<SharedV3Warning>;
  request?: {
    body?: string;
  };
  response: {
    timestamp: Date;
    modelId: string;
    body?: unknown;
  };
}

export interface RerankingResponse {
  ranking: Array<{
    index: number;
    relevanceScore: number;
  }>;
  warnings: Array<SharedV3Warning>;
  response: {
    timestamp: Date;
    modelId: string;
    body?: unknown;
  };
}

export interface SpeechResponse {
  audio: string | Uint8Array<ArrayBufferLike>;
  warnings: Array<SharedV3Warning>;
  request?: {
    body?: unknown;
  };
  response: {
    timestamp: Date;
    modelId: string;
    body?: unknown;
  };
}

export interface RealtimeResponse {
  value: string;
  expires_at: number;
  providerMetadata: Record<string, any>
}

export const defaultEndpoints = {
  chat: "/api/chat",
  images: "/v1/images/generations",
  videos: "/v1/videos",
  transcriptions: "/v1/audio/transcriptions",
  speech: "/v1/audio/speech",
  sampling: "/sampling",
  models: "/v1/models",
  reranking: "/api/rerank",
  chatCompletions: "/chat/completions",
  realtime: "/v1/realtime/client_secrets"
}
