import type {
  EndpointAdapter,
  InvokePlaygroundResult,
  NormalizedInvokeRequest,
  ResponsesEndpointConfig,
} from "../shared/types";
import { toResponsesConversationInput } from "../shared/messages";
import { resolveNativeRequestMetadata } from "../shared/nativeMetadata";
import { extractResponsesText } from "../shared/response-parsers";

const compactObject = <T extends Record<string, any>>(value: T) => Object.fromEntries(
  Object.entries(value).filter(([, entry]) => {
    if (entry === undefined) return false;
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      return Object.keys(entry).length > 0;
    }
    return true;
  }),
);

const buildResponsesBody = (request: NormalizedInvokeRequest) => {
  const { instructions, input } = toResponsesConversationInput(request.messages);
  const endpointConfig = (request.endpointConfig ?? {}) as ResponsesEndpointConfig;

  return compactObject({
    ...(request.providerRequestConfig ?? {}),
    model: request.model,
    temperature: request.temperature,
    include: endpointConfig.include,
    max_output_tokens: request.maxOutputTokens,
    metadata: resolveNativeRequestMetadata(request),
    instructions,
    input,
    stream: endpointConfig.stream,
    store: endpointConfig.store,
    top_p: endpointConfig.top_p,
    truncation: endpointConfig.truncation,
    imageInputDetail: endpointConfig.imageInputDetail,
    context_management: endpointConfig.context_management,
    parallel_tool_calls: endpointConfig.parallel_tool_calls,
    background: endpointConfig.background,
    max_tool_calls: endpointConfig.max_tool_calls,
    user: endpointConfig.user,
    service_tier: endpointConfig.service_tier,
    prompt_cache_key: endpointConfig.prompt_cache_key,
    prompt_cache_retention: endpointConfig.prompt_cache_retention,
    safety_identifier: endpointConfig.safety_identifier,
    reasoning: compactObject({
      effort: endpointConfig.reasoning?.effort,
      summary: endpointConfig.reasoning?.summary,
    }),
    text: compactObject({
      verbosity: endpointConfig.text?.verbosity,
    }),
  });
};

const parseResponsesResponse = (raw: unknown): InvokePlaygroundResult => ({
  text: extractResponsesText(raw),
  raw,
});

export const responsesEndpoint: EndpointAdapter = {
  id: "/v1/responses",
  label: "/v1/responses",
  buildRequest: (request) => ({
    endpointId: "/v1/responses",
    method: "POST",
    path: "/v1/responses",
    body: buildResponsesBody(request),
    parseResponse: parseResponsesResponse,
  }),
};

