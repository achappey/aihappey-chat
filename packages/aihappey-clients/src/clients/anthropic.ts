import Anthropic from "@anthropic-ai/sdk";
import type { ClientAdapter, NormalizedInvokeRequest } from "../shared/types";
import { createHeaders, headersToObject, resolveUrl } from "../shared/http";

const createAnthropicClient = async (
  args: Pick<NormalizedInvokeRequest, "baseUrl" | "headers" | "getAccessToken">,
) => {
  const defaultHeaders = headersToObject(await createHeaders(args.headers, args.getAccessToken));

  return {
    client: new Anthropic({
      apiKey: defaultHeaders.Authorization ? "unused" : defaultHeaders["x-api-key"] ?? defaultHeaders["api-key"] ?? "unused",
      baseURL: args.baseUrl,
      defaultHeaders,
      dangerouslyAllowBrowser: true,
    }),
    defaultHeaders,
  };
};

export const anthropicClientAdapter: ClientAdapter = {
  id: "anthropic",
  label: "Anthropic",
  supportsEndpoint: (endpoint) => endpoint.id === "/v1/messages",
  invoke: async ({ endpoint, prepared, request }) => {
    if (endpoint.id !== "/v1/messages") {
      throw new Error(`Client anthropic does not support endpoint ${endpoint.id}`);
    }

    const { client, defaultHeaders } = await createAnthropicClient(request);
    const raw = await client.messages.create(prepared.body as any);
    const parsed = prepared.parseResponse(raw);

    return {
      ...parsed,
      inspection: {
        url: resolveUrl(request.baseUrl, "/v1/messages"),
        method: prepared.method,
        headers: defaultHeaders,
        requestBody: prepared.body,
        responseBody: raw,
      },
    };
  },
};
