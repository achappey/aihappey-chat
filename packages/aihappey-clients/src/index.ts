import OpenAI from "openai";
import { createBackendProvider, generateText } from "aihappey-ai";
import type {
  PlaygroundClientOption,
  PlaygroundMessage,
  InvokePlaygroundRequest,
  InvokePlaygroundResult,
} from "./types";

type CorePlaygroundMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type {
  PlaygroundClientOption,
  PlaygroundMessage,
  InvokePlaygroundRequest,
  InvokePlaygroundResult,
} from "./types";

export const playgroundClientOptions: PlaygroundClientOption[] = [
  {
    id: "vercel-api-chat",
    label: "/api/chat — Current Vercel-style client",
    endpoint: "/api/chat",
    client: "vercel-ai-sdk",
  },
  {
    id: "openai-chat-completions-official",
    label: "/v1/chat/completions — Official OpenAI client",
    endpoint: "/v1/chat/completions",
    client: "openai",
  },
  {
    id: "vercel-chat-completions",
    label: "/v1/chat/completions — Vercel chat completions client",
    endpoint: "/v1/chat/completions",
    client: "vercel-ai-sdk",
  },
  {
    id: "vercel-responses",
    label: "/v1/responses — Vercel responses client",
    endpoint: "/v1/responses",
    client: "vercel-ai-sdk",
  },
  {
    id: "openai-responses-official",
    label: "/v1/responses — Official OpenAI client",
    endpoint: "/v1/responses",
    client: "openai",
  },
];

export const playgroundEndpointOptions = Array.from(
  new Set(playgroundClientOptions.map((option) => option.endpoint)),
);

export const playgroundClientChoices = Array.from(
  new Set(playgroundClientOptions.map((option) => option.client)),
);

const byId = new Map(playgroundClientOptions.map((option) => [option.id, option]));

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const resolveUrl = (baseUrl: string, endpoint: string) => {
  const base = trimTrailingSlash(baseUrl || "");
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};

const textMessageContent = (content: string) => [{ type: "text" as const, text: content }];
const inputTextMessageContent = (content: string) => [{ type: "input_text" as const, text: content }];

const toCoreMessages = (
  messages: PlaygroundMessage[],
): CorePlaygroundMessage[] =>
  normalizeMessages(messages).map((message) => {
    return {
      role: message.role,
      content: message.content,
    };
  });

const normalizeMessages = (messages: PlaygroundMessage[]) =>
  messages
    .map((message) => ({
      role: message.role,
      content: String(message.content ?? "").trim(),
    }))
    .filter((message) => message.content.length > 0);

const extractResponsesText = (response: any): string => {
  if (typeof response?.output_text === "string" && response.output_text.trim()) {
    return response.output_text;
  }

  const pieces = (response?.output ?? [])
    .flatMap((item: any) => item?.content ?? [])
    .map((item: any) => item?.text ?? item?.output_text ?? "")
    .filter(Boolean);

  return pieces.join("\n\n").trim();
};

const extractChatCompletionsText = (response: any): string => {
  const choice = response?.choices?.[0];
  const content = choice?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item: any) => item?.text ?? item?.content ?? "")
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }
  return "";
};

const createHeaders = async (
  headers?: Record<string, string>,
  getAccessToken?: () => Promise<string>,
) => {
  const merged = new Headers(headers ?? {});
  if (getAccessToken) {
    const token = await getAccessToken();
    if (token) merged.set("Authorization", `Bearer ${token}`);
  }
  if (!merged.has("Content-Type")) {
    merged.set("Content-Type", "application/json");
  }
  return merged;
};

const createOpenAIClient = async (
  args: Pick<InvokePlaygroundRequest, "baseUrl" | "headers" | "getAccessToken">,
) => {
  const defaultHeaders = Object.fromEntries(
    Array.from((await createHeaders(args.headers, args.getAccessToken)).entries()),
  );

  return new OpenAI({
    apiKey: defaultHeaders.Authorization ? "unused" : defaultHeaders["x-api-key"] ?? defaultHeaders["api-key"] ?? "unused",
    baseURL: trimTrailingSlash(args.baseUrl) + "/v1",
    defaultHeaders,
    dangerouslyAllowBrowser: true,
  });
};


const invokeVercelResponsesSdk = async (
  request: InvokePlaygroundRequest,
  endpoint: string,
): Promise<InvokePlaygroundResult> => {
  // const resolvedUrl = resolveUrl(request.baseUrl, endpoint);
  const provider = createBackendProvider(
    new URL(request.baseUrl).hostname,
    request.baseUrl + "/v1",
    request.headers,
    request.getAccessToken,
  );

  const model = provider.responses(request.model);
  const raw = await generateText({
    model,
    temperature: request.temperature,
    maxOutputTokens: request.maxOutputTokens,
    providerOptions: request.providerMetadata,
    messages: toCoreMessages(request.messages),
    tools: {},
  } as any);

  return {
    text: raw.text ?? "",
    raw,
  };
};

const invokeVercelChatSdk = async (
  request: InvokePlaygroundRequest,
  endpoint: string,
): Promise<InvokePlaygroundResult> => {
  // const resolvedUrl = resolveUrl(request.baseUrl, endpoint);
  const provider = createBackendProvider(
    new URL(request.baseUrl).hostname,
    request.baseUrl + "/v1",
    request.headers,
    request.getAccessToken,
  );

  const model = provider.chat(request.model);
  const raw = await generateText({
    model,
    temperature: request.temperature,
    maxOutputTokens: request.maxOutputTokens,
    providerOptions: request.providerMetadata,
    messages: toCoreMessages(request.messages),
    tools: {},
  } as any);

  return {
    text: raw.text ?? "",
    raw,
  };
};

const invokeOfficialChatCompletions = async (
  request: InvokePlaygroundRequest,
): Promise<InvokePlaygroundResult> => {
  const client = await createOpenAIClient(request);
  const raw = await client.chat.completions.create({
    model: request.model,
    temperature: request.temperature,
    max_tokens: request.maxOutputTokens,
    messages: normalizeMessages(request.messages),
  });

  return {
    text: extractChatCompletionsText(raw),
    raw,
  };
};

const invokeOfficialResponses = async (
  request: InvokePlaygroundRequest,
): Promise<InvokePlaygroundResult> => {
  const client = await createOpenAIClient(request);
  const normalized = normalizeMessages(request.messages);
  const systemMessage = normalized.find((message) => message.role === "system")?.content;
  const input = normalized
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role,
      content: inputTextMessageContent(message.content),
    }));

  const raw = await client.responses.create({
    model: request.model,
    temperature: request.temperature,
    max_output_tokens: request.maxOutputTokens,
    instructions: systemMessage,
    input,
  } as any);

  return {
    text: extractResponsesText(raw),
    raw,
  };
};

export const getPlaygroundClientOption = (id: string) => byId.get(id);

export async function invokePlayground(request: InvokePlaygroundRequest): Promise<InvokePlaygroundResult> {
  const option = byId.get(request.optionId);
  if (!option) {
    throw new Error(`Unknown playground option: ${request.optionId}`);
  }

  switch (option.id) {
    //   case "vercel-api-chat":
    //    return invokeVercelSdk(request, option.endpoint);
    case "vercel-chat-completions":
      return invokeVercelChatSdk(request, option.endpoint);
    case "vercel-responses":
      return invokeVercelResponsesSdk(request, option.endpoint);
    case "openai-chat-completions-official":
      return invokeOfficialChatCompletions(request);
    case "openai-responses-official":
      return invokeOfficialResponses(request);
    default:
      throw new Error(`Unsupported playground option: ${option.id}`);
  }
}
