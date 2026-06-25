import type {
  EndpointAdapter,
  InvokePlaygroundResult,
  MessagesEndpointConfig,
  NormalizedInvokeRequest,
} from "../shared/types";
import { getSystemPrompt, toAnthropicMessages } from "../shared/messages";
import { extractAnthropicMessagesText } from "../shared/response-parsers";

const compactObject = <T extends Record<string, any>>(value: T) => Object.fromEntries(
  Object.entries(value).filter(([, entry]) => {
    if (entry === undefined) return false;
    if (Array.isArray(entry)) return entry.length > 0;
    if (entry && typeof entry === "object") return Object.keys(entry).length > 0;
    return true;
  }),
);

const buildMessagesBody = (request: NormalizedInvokeRequest) => {
  const endpointConfig = (request.endpointConfig ?? {}) as MessagesEndpointConfig;

  return compactObject({
    model: request.model,
    system: getSystemPrompt(request.messages),
    temperature: request.temperature,
    max_tokens: request.maxOutputTokens,
    messages: toAnthropicMessages(request.messages),
    stream: endpointConfig.stream,
    top_p: endpointConfig.top_p,
    top_k: endpointConfig.top_k,
    service_tier: endpointConfig.service_tier,
    container: endpointConfig.container,
    inference_geo: endpointConfig.inference_geo,
    stop_sequences: endpointConfig.stop_sequences,
    metadata: compactObject({
      ...(request.providerMetadata ?? {}),
      user_id: endpointConfig.metadata?.user_id,
    }),
    output_config: compactObject({
      effort: endpointConfig.output_config?.effort,
    }),
    thinking: compactObject({
      type: endpointConfig.thinking?.type,
      budget_tokens: endpointConfig.thinking?.budget_tokens,
      display: endpointConfig.thinking?.display,
    }),
  });
};

const parseMessagesResponse = (raw: unknown): InvokePlaygroundResult => ({
  text: extractAnthropicMessagesText(raw),
  raw,
});

export const messagesEndpoint: EndpointAdapter = {
  id: "/v1/messages",
  label: "/v1/messages",
  buildRequest: (request) => ({
    endpointId: "/v1/messages",
    method: "POST",
    path: "/v1/messages",
    body: buildMessagesBody(request),
    parseResponse: parseMessagesResponse,
  }),
};
