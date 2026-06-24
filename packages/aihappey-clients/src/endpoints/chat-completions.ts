import type {
  ChatCompletionsEndpointConfig,
  EndpointAdapter,
  InvokePlaygroundResult,
  NormalizedInvokeRequest,
} from "../shared/types";
import { toChatCompletionsMessages } from "../shared/messages";
import { extractChatCompletionsText } from "../shared/response-parsers";

const compactObject = <T extends Record<string, any>>(value: T) => Object.fromEntries(
  Object.entries(value).filter(([, entry]) => entry !== undefined),
);

const buildChatCompletionsBody = (request: NormalizedInvokeRequest) => {
  const endpointConfig = (request.endpointConfig ?? {}) as ChatCompletionsEndpointConfig;

  return compactObject({
    model: request.model,
    temperature: request.temperature,
    max_tokens: request.maxOutputTokens,
    providerMetadata: request.providerMetadata,
    messages: toChatCompletionsMessages(request.messages),
    stream: endpointConfig.stream,
    n: endpointConfig.n,
    top_p: endpointConfig.top_p,
    presence_penalty: endpointConfig.presence_penalty,
    frequency_penalty: endpointConfig.frequency_penalty,
    store: endpointConfig.store,
    parallel_tool_calls: endpointConfig.parallel_tool_calls,
    user: endpointConfig.user,
    service_tier: endpointConfig.service_tier,
    reasoning_effort: endpointConfig.reasoning_effort,
    verbosity: endpointConfig.verbosity,
  });
};

const parseChatCompletionsResponse = (raw: unknown): InvokePlaygroundResult => ({
  text: extractChatCompletionsText(raw),
  raw,
});

export const chatCompletionsEndpoint: EndpointAdapter = {
  id: "/v1/chat/completions",
  label: "/v1/chat/completions",
  buildRequest: (request) => ({
    endpointId: "/v1/chat/completions",
    method: "POST",
    path: "/v1/chat/completions",
    body: buildChatCompletionsBody(request),
    parseResponse: parseChatCompletionsResponse,
  }),
};

