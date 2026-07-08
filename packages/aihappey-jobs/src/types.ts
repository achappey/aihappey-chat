import type { ResponseApiCreateRequest, ResponseApiResponse } from "aihappey-ai";

export type JobStorageKind = "local" | "indexeddb";

export type JobStatus =
  | "queued"
  | "in_progress"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "incomplete"
  | string;

export interface JobItem {
  id: string;
  responseId?: string;
  createdAt: Date;
  updatedAt: Date;
  inputPreview: string;
  request: ResponseApiCreateRequest;
  response: ResponseApiResponse;
}

export interface JobStore {
  readonly kind: JobStorageKind;
  add(
    request: ResponseApiCreateRequest,
    response: ResponseApiResponse,
    inputPreview?: string,
  ): Promise<JobItem>;
  list(): Promise<JobItem[]>;
  update(id: string, response: ResponseApiResponse): Promise<JobItem>;
  delete(id: string, jobItem?: unknown): Promise<void>;
}

export const activeJobStatuses = new Set<JobStatus>([
  "queued",
  "in_progress",
  "running",
]);

export const terminalJobStatuses = new Set<JobStatus>([
  "completed",
  "failed",
  "cancelled",
  "incomplete",
]);

export const getJobStatus = (job: Pick<JobItem, "response">): JobStatus =>
  job.response?.status ?? "queued";

export const isActiveJobStatus = (status?: string) =>
  !!status && activeJobStatuses.has(status);

export const isTerminalJobStatus = (status?: string) =>
  !!status && terminalJobStatuses.has(status);

