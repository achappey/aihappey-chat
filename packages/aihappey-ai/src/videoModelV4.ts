import type {
  JSONValue,
  SharedV4ProviderMetadata,
  SharedV4ProviderOptions,
  SharedV4Warning,
} from "@ai-sdk/provider";

export type VideoModelV4File =
  | { type: "file"; mediaType: string; data: string | Uint8Array; providerOptions?: SharedV4ProviderOptions }
  | { type: "url"; url: string; providerOptions?: SharedV4ProviderOptions };

export type VideoModelV4FrameImage = {
  image: VideoModelV4File;
  frameType: "first_frame" | "last_frame";
};

export type VideoModelV4VideoData =
  | { type: "url"; url: string; mediaType: string }
  | { type: "base64"; data: string; mediaType: string }
  | { type: "binary"; data: Uint8Array; mediaType: string };

export type VideoModelV4CallOptions = {
  prompt: string | undefined;
  n: number;
  aspectRatio: `${number}:${number}` | undefined;
  resolution: `${number}x${number}` | undefined;
  duration: number | undefined;
  fps: number | undefined;
  seed: number | undefined;
  image: VideoModelV4File | undefined;
  frameImages: VideoModelV4FrameImage[] | undefined;
  inputReferences: VideoModelV4File[] | undefined;
  generateAudio: boolean | undefined;
  providerOptions: SharedV4ProviderOptions;
  abortSignal?: AbortSignal;
  headers?: Record<string, string | undefined>;
};

type VideoModelV4Response = {
  timestamp: Date;
  modelId: string;
  headers: Record<string, string> | undefined;
};

export type VideoModelV4OperationStartResult = {
  operation: JSONValue;
  warnings: SharedV4Warning[];
  providerMetadata?: SharedV4ProviderMetadata;
  response: VideoModelV4Response;
};

export type VideoModelV4OperationStatusResult =
  | { status: "pending"; warnings?: SharedV4Warning[]; providerMetadata?: SharedV4ProviderMetadata; response: VideoModelV4Response }
  | { status: "completed"; videos: VideoModelV4VideoData[]; warnings: SharedV4Warning[]; providerMetadata?: SharedV4ProviderMetadata; response: VideoModelV4Response }
  | { status: "error"; error: string; providerMetadata?: SharedV4ProviderMetadata; response: VideoModelV4Response };

export type VideoModelV4 = {
  readonly specificationVersion: "v4";
  readonly provider: string;
  readonly modelId: string;
  readonly maxVideosPerCall: number | undefined | ((options: { modelId: string }) => PromiseLike<number | undefined> | number | undefined);
  doStart?(options: VideoModelV4CallOptions & { webhookUrl?: string }): PromiseLike<VideoModelV4OperationStartResult>;
  doStatus?(options: { operation: JSONValue; abortSignal?: AbortSignal; headers?: Record<string, string | undefined> }): PromiseLike<VideoModelV4OperationStatusResult>;
};
