import type { ResponseApiCreateRequest, ResponseApiResponse } from "./types";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const readErrorBody = async (response: Response) => {
  try {
    return await response.text();
  } catch {
    return response.statusText;
  }
};

export function createResponsesProvider(config: {
  baseUrl: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}) {
  const fetchImpl = config.fetch ?? fetch;
  const baseUrl = trimTrailingSlash(config.baseUrl);

  const requestJson = async <T>(url: string, init: RequestInit): Promise<T> => {
    const response = await fetchImpl(url, {
      ...init,
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(config.headers ?? {}),
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Responses API failed (${response.status} ${await readErrorBody(response)})`);
    }

    if (response.status === 204) return undefined as T;
    return await response.json();
  };

  return {
    create: async (request: ResponseApiCreateRequest): Promise<ResponseApiResponse> =>
      requestJson<ResponseApiResponse>(baseUrl, {
        method: "POST",
        body: JSON.stringify({
          ...request,
          background: request.background ?? true,
          store: request.store ?? (request.background ?? true),
          stream: request.stream ?? false,
        }),
      }),

    retrieve: async (responseId: string): Promise<ResponseApiResponse> =>
      requestJson<ResponseApiResponse>(`${baseUrl}/${encodeURIComponent(responseId)}`, {
        method: "GET",
      }),

    delete: async (responseId: string): Promise<ResponseApiResponse | undefined> =>
      requestJson<ResponseApiResponse | undefined>(`${baseUrl}/${encodeURIComponent(responseId)}`, {
        method: "DELETE",
      }),
  };
}

