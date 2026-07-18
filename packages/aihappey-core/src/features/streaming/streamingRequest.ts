import type { ChatConfig } from "../chat/context/ChatProvider";

export const buildStreamingHeaders = async (
  config: ChatConfig,
  customHeaders?: Record<string, string>,
) => {
  const headers = new Headers({
    ...(config.headers ?? {}),
    ...(customHeaders ?? {}),
    Accept: "text/event-stream",
  });
  if (config.getAccessToken) headers.set("Authorization", `Bearer ${await config.getAccessToken()}`);
  return headers;
};

export const resolveStreamingUrl = (baseUrl: string, endpoint: string) =>
  `${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

export const streamingErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof DOMException && error.name === "AbortError") return "";
  return error instanceof Error && error.message ? error.message : fallback;
};
