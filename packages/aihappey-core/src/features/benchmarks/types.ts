import type { ChatEndpointId } from "aihappey-state";
import type { ModelOption, Provider } from "aihappey-types";
import type { ChatConfig } from "../chat/context/ChatContext";

export type BenchmarkSettings = {
  temperature?: number;
  maxOutputTokens?: number;
  providerMetadata: Record<string, any>;
  providerHeaders: Record<string, Record<string, string>>;
};

export type BenchmarkTarget = {
  id: string;
  ordinal: number;
  color: string;
  modelId: string;
  mode: "default" | "direct";
  endpoint: ChatEndpointId;
  settings: BenchmarkSettings;
};

export type BenchmarkEnvironment = {
  config: Pick<ChatConfig, "baseUrl" | "gatewayEnabled" | "getAccessToken" | "headers" | "fetch">;
  gatewayEnabled?: boolean;
  customHeaders?: Record<string, string>;
  models: ModelOption[];
  providers: Record<string, Provider>;
};

export type BenchmarkTargetSnapshot = BenchmarkTarget & {
  model: ModelOption;
  modelLabel: string;
  baseUrl: string;
  requestModel: string;
  providerKey?: string;
};

export type BenchmarkBatch = {
  id: string;
  ordinal: number;
  prompt: string;
  repeats: number;
  concurrency: number;
  targets: BenchmarkTargetSnapshot[];
};

export type BenchmarkMetrics = { ttft?: number; tps?: number };
export type BenchmarkRunStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

/** Display records intentionally contain no request settings, headers or credentials. */
export type BenchmarkRun = BenchmarkMetrics & {
  id: string;
  batchId: string;
  batchOrdinal: number;
  targetId: string;
  targetOrdinal: number;
  color: string;
  modelLabel: string;
  mode: BenchmarkTarget["mode"];
  endpoint: ChatEndpointId;
  repetition: number;
  status: BenchmarkRunStatus;
  error?: string;
};
