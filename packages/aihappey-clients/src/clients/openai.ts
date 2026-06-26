import OpenAI from "openai";
import type { ClientAdapter, NormalizedInvokeRequest } from "../shared/types";
import { createHeaders, headersToObject, trimBaseUrl } from "../shared/http";

const getAuthorizationToken = (headers: Record<string, string>) => {
  const authorization = headers.authorization ?? headers.Authorization;
  if (!authorization) return undefined;

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || undefined;
};

const resolveSdkBaseUrl = (baseUrl: string) => {
  const trimmed = trimBaseUrl(baseUrl);
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
};

const createOpenAIClient = async (
  args: Pick<NormalizedInvokeRequest, "baseUrl" | "headers" | "getAccessToken">,
) => {
  const allHeaders = headersToObject(await createHeaders(args.headers, args.getAccessToken));
  const authorizationToken = getAuthorizationToken(allHeaders);
  const defaultHeaders = { ...allHeaders };

  delete defaultHeaders["content-type"];
  delete (defaultHeaders as any)["Content-Type"];

  if (authorizationToken) {
    delete defaultHeaders.authorization;
    delete (defaultHeaders as any).Authorization;
  }

  return {
    client: new OpenAI({
      apiKey: authorizationToken ?? defaultHeaders["x-api-key"] ?? defaultHeaders["api-key"] ?? "unused",
      baseURL: resolveSdkBaseUrl(args.baseUrl),
      defaultHeaders,
      dangerouslyAllowBrowser: true,
    }),
    defaultHeaders: authorizationToken
      ? {
        ...defaultHeaders,
        authorization: `Bearer ${authorizationToken}`,
      }
      : defaultHeaders,
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

