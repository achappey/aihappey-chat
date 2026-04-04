import type { CreateMessageRequest } from "aihappey-mcp";
import type { NormalizedInvokeRequest, NormalizedPlaygroundMessage, PlaygroundMessage } from "./types";

export type CorePlaygroundMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ResponsesInputContentPart = {
  type: "input_text";
  text: string;
};

export type ResponsesOutputContentPart = {
  type: "output_text";
  text: string;
};

export type ResponsesConversationItem = {
  role: "user" | "assistant";
  content: Array<ResponsesInputContentPart | ResponsesOutputContentPart>;
};

export type NormalizedResponsesConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export const toAnthropicMessages = (messages: PlaygroundMessage[]) => {
  const normalized = normalizeMessages(messages);
  return normalized
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: [{ type: "text" as const, text: message.content }],
    }));
};

export const getSystemPrompt = (messages: PlaygroundMessage[]) =>
  normalizeMessages(messages).find((message) => message.role === "system")?.content;

export const toSamplingCreateMessageRequest = (request: NormalizedInvokeRequest): any => ({
    messages: request.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role as "user" | "assistant",
        content: [{ type: "text", text: message.content }],
      })),
    systemPrompt: getSystemPrompt(request.messages),
    maxTokens: request.maxOutputTokens ?? 1024,
    temperature: request.temperature,
    modelPreferences: {
      hints: request.model ? [{ name: request.model }] : undefined,
    },
    metadata: request.providerMetadata,
  });

export const normalizeMessages = (messages: PlaygroundMessage[]): NormalizedPlaygroundMessage[] =>
  messages
    .map((message) => ({
      role: message.role,
      content: String(message.content ?? "").trim(),
    }))
    .filter((message) => message.content.length > 0);

export const normalizeRequest = (request: Omit<NormalizedInvokeRequest, "messages"> & { messages: PlaygroundMessage[] }): NormalizedInvokeRequest => ({
  ...request,
  messages: normalizeMessages(request.messages),
});

export const toCoreMessages = (
  messages: PlaygroundMessage[],
): CorePlaygroundMessage[] =>
  normalizeMessages(messages).map((message) => ({
    role: message.role,
    content: message.content,
  }));

const inputTextMessageContent = (content: string) => [{ type: "input_text" as const, text: content }];
const outputTextMessageContent = (content: string) => [{ type: "output_text" as const, text: content }];

export const toResponsesConversationInput = (
  messages: PlaygroundMessage[],
): {
  instructions?: string;
  input: ResponsesConversationItem[];
} => {
  const normalized = normalizeMessages(messages);
  const instructions = normalized.find((message) => message.role === "system")?.content;
  const input = normalized
    .filter((message): message is NormalizedResponsesConversationMessage => message.role !== "system")
    .map((message) => ({
      role: message.role,
      content: message.role === "assistant"
        ? outputTextMessageContent(message.content)
        : inputTextMessageContent(message.content),
    }));

  return {
    instructions,
    input,
  };
};

