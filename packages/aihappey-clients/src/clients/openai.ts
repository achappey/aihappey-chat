import OpenAI from "openai";
import type { ClientAdapter, NormalizedInvokeRequest } from "../shared/types";
import { createHeaders, headersToObject, trimBaseUrl } from "../shared/http";

const createOpenAIClient = async (
  args: Pick<NormalizedInvokeRequest, "baseUrl" | "headers" | "getAccessToken">,
) => {
  const defaultHeaders = headersToObject(await createHeaders(args.headers, args.getAccessToken));

  return {
    client: new OpenAI({
      apiKey: defaultHeaders.Authorization ? "unused" : defaultHeaders["x-api-key"] ?? defaultHeaders["api-key"] ?? "unused",
      baseURL: trimBaseUrl(args.baseUrl) + "/v1",
      defaultHeaders,
      dangerouslyAllowBrowser: true,
    }),
    defaultHeaders,
  };
};

export const openAiClientAdapter: ClientAdapter = {
  id: "openai",
  label: "OpenAI",
  supportsEndpoint: (endpoint) => endpoint.id === "/v1/chat/completions" || endpoint.id === "/v1/responses",
  invoke: async ({ endpoint, prepared, request }) => {
    const { client, defaultHeaders } = await createOpenAIClient(request);

    if (endpoint.id === "/v1/chat/completions") {
      const raw = await client.chat.completions.create(prepared.body as any);
      const parsed = prepared.parseResponse(raw);
      return {
        ...parsed,
        inspection: {
          url: trimBaseUrl(request.baseUrl) + "/v1/chat/completions",
          method: prepared.method,
          headers: defaultHeaders,
          requestBody: prepared.body,
          responseBody: raw,
        },
      };
    }

    if (endpoint.id === "/v1/responses") {
      const raw = await client.responses.create(prepared.body as any);
      const parsed = prepared.parseResponse(raw);
      return {
        ...parsed,
        inspection: {
          url: trimBaseUrl(request.baseUrl) + "/v1/responses",
          method: prepared.method,
          headers: defaultHeaders,
          requestBody: prepared.body,
          responseBody: raw,
        },
      };
    }

    throw new Error(`Client openai does not support endpoint ${endpoint.id}`);
  },
};

