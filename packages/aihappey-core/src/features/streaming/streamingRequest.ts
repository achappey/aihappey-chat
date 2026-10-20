import type { ChatConfig } from "../chat/context/ChatProvider";
import { buildOperationHeaders } from "../provider-credentials/scopedRequest";

export const buildStreamingHeaders = async (
  config: ChatConfig,
  customHeaders?: Record<string, string>,
  modelId?: string,
) => {
  const headers = new Headers({
    ...await buildOperationHeaders(config, customHeaders, modelId),
    Accept: "text/event-stream",
  });
  return headers;
};

export const resolveStreamingUrl = (baseUrl: string, endpoint: string) =>
  `${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

export const streamingErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof DOMException && error.name === "AbortError") return "";
  return error instanceof Error && error.message ? error.message : fallback;
};
