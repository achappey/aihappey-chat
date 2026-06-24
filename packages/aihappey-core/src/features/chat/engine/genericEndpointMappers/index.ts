import { buildChatCompletionsBody } from "./chatCompletionsMapper";
import { buildMessagesBody } from "./messagesMapper";
import { buildResponsesBody } from "./responsesMapper";
import type { GenericChatEndpointRequestBody, GenericEndpointId } from "./types";

export type { GenericChatEndpointRequestBody, GenericEndpointId } from "./types";

export function buildGenericChatEndpointBody(endpoint: GenericEndpointId, body: GenericChatEndpointRequestBody) {
  if (endpoint === "/v1/chat/completions") return buildChatCompletionsBody(body);
  if (endpoint === "/v1/responses") return buildResponsesBody(body);
  if (endpoint === "/v1/messages") return buildMessagesBody(body);
  throw new Error(`Unsupported chat endpoint: ${endpoint}`);
}
