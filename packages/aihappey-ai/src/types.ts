import type { SharedV4Warning, ImageModelV4ProviderMetadata, ImageModelV4Usage } from "@ai-sdk/provider"

export interface AiChatConfig {
  api?: string;
  getAccessToken?: () => Promise<string>;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}

export interface ImageResponse {
  images: string[] | Uint8Array<ArrayBufferLike>[];
  warnings: Array<SharedV4Warning>;
  providerMetadata?: ImageModelV4ProviderMetadata;
  response: {
    timestamp: Date;
    modelId: string;
    headers: Record<string, string> | undefined;
  };
  usage?: ImageModelV4Usage;
}

export interface VideoResponse {
  videos: VideoResponseFile[];
  warnings: Array<SharedV4Warning>;
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
  warnings: Array<SharedV4Warning>;
  providerMetadata?: Record<string, any>;
  request?: {
    body?: string;
  };
  response: {
    timestamp: Date;
    modelId: string;
    headers?: Record<string, string> | undefined;
    body?: unknown;
  };
}

export interface RerankingResponse {
  ranking: Array<{
    index: number;
    relevanceScore: number;
  }>;
  warnings: Array<SharedV4Warning>;
  providerMetadata?: Record<string, any>;
  response: {
    id?: string;
    timestamp: Date;
    modelId: string;
    headers?: Record<string, string>
    body?: unknown;
  };
}

export interface SpeechResponse {
  audio: string | Uint8Array<ArrayBufferLike> | {
    base64?: string;
    data?: string;
    mimeType?: string;
    format?: string;
  };
  warnings: Array<SharedV4Warning>;
  providerMetadata?: Record<string, any>;
  request?: {
    body?: unknown;
  };
  response: {
    timestamp: Date;
    modelId: string;
    headers?: Record<string, string>
    body?: unknown;
  };
}

export interface RealtimeResponse {
  value: string;
  expires_at: number;
  providerMetadata: Record<string, any>
}

export type ResponseApiStatus =
  | "queued"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled"
  | "incomplete"
  | string;

export type ResponseApiInputContent =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail?: string }
  | { type: "input_file"; file_data: string; filename?: string }
  | Record<string, any>;

export interface ResponseApiInputMessage {
  type?: "message" | string;
  role: "user" | "assistant" | "system" | string;
  content: string | ResponseApiInputContent[];
}

export interface ResponseApiCreateRequest {
  model?: string;
  models?: string[];
  input: string | ResponseApiInputMessage[];
  background?: boolean;
  store?: boolean;
  stream?: boolean;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface ResponseApiResponse {
  id?: string;
  object?: string;
  created_at?: number;
  status?: ResponseApiStatus;
  model?: string;
  output?: any[];
  error?: unknown;
  incomplete_details?: unknown;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export const defaultEndpoints = {
  chat: "/api/chat",
  images: "/v1/images/generations",
  videos: "/api/videos",
  transcriptions: "/api/transcriptions",
  speech: "/api/speech",
  skills: "/v1/skills",
  sampling: "/sampling",
  models: "/v1/models",
  reranking: "/api/rerank",
  chatCompletions: "/v1/chat/completions",
  responses: "/v1/responses",
  realtime: "/v1/realtime/client_secrets"
}
