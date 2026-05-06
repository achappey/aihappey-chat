import type {
  ClientAdapter,
  EndpointAdapter,
  InvokePlaygroundRequest,
  InvokePlaygroundResult,
  PreparedPlaygroundInvocation,
  PlaygroundClientId,
  PlaygroundClientOption,
  PlaygroundEndpointId,
} from "./shared/types";
import { openAiClientAdapter } from "./clients/openai";
import { rawFetchClientAdapter } from "./clients/fetch";
import { vercelClientAdapter } from "./clients/vercel";
import { chatCompletionsEndpoint } from "./endpoints/chat-completions";
import { messagesEndpoint } from "./endpoints/messages";
import { responsesEndpoint } from "./endpoints/responses";
import { samplingEndpoint } from "./endpoints/sampling";
import { normalizeRequest } from "./shared/messages";

const endpointAdapters: EndpointAdapter[] = [
  {
    id: "/api/chat",
    label: "/api/chat",
    buildRequest: () => {
      throw new Error("/api/chat is handled by the streaming transport in the playground UI.");
    },
  },
  chatCompletionsEndpoint,
  responsesEndpoint,
  messagesEndpoint,
  samplingEndpoint,
];

const clientAdapters: ClientAdapter[] = [
  vercelClientAdapter,
  openAiClientAdapter,
  //anthropicClientAdapter,
  rawFetchClientAdapter,
];

const explicitOptions: PlaygroundClientOption[] = [
  {
    id: "vercel-api-chat",
    label: "/api/chat — Current Vercel-style client",
    endpoint: "/api/chat",
    client: "vercel-ai-sdk",
  },
];

const registryOptions: PlaygroundClientOption[] = endpointAdapters
  .filter((endpoint) => endpoint.id !== "/api/chat")
  .flatMap((endpoint) => clientAdapters
    .filter((client) => client.supportsEndpoint(endpoint))
    .map((client) => ({
      id: `${String(client.id).replace(/[^a-z0-9]+/gi, "-")}-${String(endpoint.id).replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "")}`.toLowerCase(),
      label: `${endpoint.label} — ${client.label}`,
      endpoint: endpoint.id,
      client: client.id,
    })));

export const playgroundClientOptions: PlaygroundClientOption[] = [
  ...explicitOptions,
  ...registryOptions,
];

export const playgroundEndpointOptions = Array.from(
  new Set(playgroundClientOptions.map((option) => option.endpoint)),
);

export const playgroundClientChoices = Array.from(
  new Set(playgroundClientOptions.map((option) => option.client)),
);

const optionsById = new Map(playgroundClientOptions.map((option) => [option.id, option]));
const endpointsById = new Map(endpointAdapters.map((endpoint) => [endpoint.id, endpoint]));
const clientsById = new Map(clientAdapters.map((client) => [client.id, client]));

export const getPlaygroundClientOption = (id: string) => optionsById.get(id);

export const getPlaygroundEndpoint = (id: PlaygroundEndpointId | string) => endpointsById.get(id);

export const getPlaygroundClient = (id: PlaygroundClientId) => clientsById.get(id);

export const getCompatiblePlaygroundClients = (endpointId: PlaygroundEndpointId | string) => {
  const endpoint = endpointsById.get(endpointId);
  if (!endpoint) return [];
  return clientAdapters.filter((client) => client.supportsEndpoint(endpoint));
};

export function preparePlaygroundRequest(request: InvokePlaygroundRequest): PreparedPlaygroundInvocation {
  const option = optionsById.get(request.optionId);
  if (!option) {
    throw new Error(`Unknown playground option: ${request.optionId}`);
  }

  const endpoint = endpointsById.get(option.endpoint);
  if (!endpoint) {
    throw new Error(`Unknown endpoint adapter: ${option.endpoint}`);
  }

  const client = clientsById.get(option.client);
  if (!client && option.id !== "vercel-api-chat") {
    throw new Error(`Unknown client adapter: ${option.client}`);
  }

  const normalizedRequest = normalizeRequest(request);
  const prepared = endpoint.buildRequest(normalizedRequest);

  return {
    option,
    endpoint,
    client,
    request: normalizedRequest,
    prepared,
  };
}

export async function invokePlayground(request: InvokePlaygroundRequest): Promise<InvokePlaygroundResult> {
  const preparedInvocation = preparePlaygroundRequest(request);
  const { option, endpoint, client, prepared, request: normalizedRequest } = preparedInvocation;

  if (option.id === "vercel-api-chat") {
    throw new Error("/api/chat is handled by the streaming playground transport and should not be invoked through invokePlayground.");
  }

  if (!client) {
    throw new Error(`Unknown client adapter: ${option.client}`);
  }
  return client.invoke({ endpoint, prepared, request: normalizedRequest });
}

