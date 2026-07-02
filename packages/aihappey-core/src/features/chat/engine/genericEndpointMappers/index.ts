import { buildChatCompletionsBody } from "./chatCompletionsMapper";
import { buildConversationsBody } from "./conversationsMapper";
import { buildInteractionsBody } from "./interactionsMapper";
import { buildMessagesBody } from "./messagesMapper";
import { buildResponsesBody } from "./responsesMapper";
import { buildZaiAgentsBody } from "./zaiAgentsMapper";
import type { GenericChatEndpointRequestBody, GenericEndpointId } from "./types";

export type { GenericChatEndpointRequestBody, GenericEndpointId } from "./types";

export function buildGenericChatEndpointBody(endpoint: GenericEndpointId, body: GenericChatEndpointRequestBody) {
  if (endpoint === "/v1/chat/completions" || endpoint === "/paas/v4/chat/completions"
    || endpoint == "/chat/completions"
    || endpoint == "/v1/openai/chat/completions") {
    return buildChatCompletionsBody({ ...body, endpoint });
  }
  if (endpoint === "/v1/conversations") return buildConversationsBody(body);
  if (endpoint === "/v1/responses") return buildResponsesBody(body);
  if (endpoint === "/v1/messages") return buildMessagesBody(body);
  if (endpoint === "/v1beta/interactions") return buildInteractionsBody(body);
  if (endpoint === "/v1/agents") return buildZaiAgentsBody(body);
  throw new Error(`Unsupported chat endpoint: ${endpoint}`);
}
