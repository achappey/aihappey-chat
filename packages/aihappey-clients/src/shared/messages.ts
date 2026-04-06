import type {
  AudioContent,
  BlobResourceContents,
  CreateMessageRequest,
  ImageContent,
  TextResourceContents,
} from "@modelcontextprotocol/sdk/types";
import type {
  NormalizedInvokeRequest,
  NormalizedPlaygroundMessage,
  PlaygroundAttachment,
  PlaygroundMessage,
} from "./types";

export type CorePlaygroundMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ResponsesInputContentPart = {
  type: "input_text";
  text: string;
};

export type ResponsesImageContentPart = {
  type: "input_image";
  image_url: string;
};

export type ResponsesFileContentPart = {
  type: "input_file";
  file_data: string;
  filename?: string;
};

export type ResponsesOutputContentPart = {
  type: "output_text";
  text: string;
};

export type ResponsesConversationItem = {
  role: "user" | "assistant";
  content: Array<
    ResponsesInputContentPart
    | ResponsesImageContentPart
    | ResponsesFileContentPart
    | ResponsesOutputContentPart
  >;
};

export type NormalizedResponsesConversationMessage = {
  role: "user" | "assistant";
  content: string;
  attachments: PlaygroundAttachment[];
};

type AnthropicTextContentBlock = {
  type: "text";
  text: string;
};

type AnthropicImageContentBlock = {
  type: "image";
  source: {
    type: "base64";
    media_type: string;
    data: string;
  };
};

type AnthropicDocumentContentBlock = {
  type: "document";
  source:
    | {
      type: "base64";
      media_type: "application/pdf";
      data: string;
    }
    | {
      type: "text";
      media_type: "text/plain";
      data: string;
    };
  title?: string;
};

type AnthropicMessageContentBlock =
  | AnthropicTextContentBlock
  | AnthropicImageContentBlock
  | AnthropicDocumentContentBlock;

const inputTextBlock = (content: string): AnthropicTextContentBlock[] =>
  content.length > 0 ? [{ type: "text", text: content }] : [];

type SamplingTextContentBlock = {
  type: "text";
  text: string;
};

type SamplingMessage = CreateMessageRequest["params"]["messages"][number];
type SamplingMessageContent = SamplingMessage["content"];

type SamplingResourceContentBlock = {
  type: "resource";
  resource: TextResourceContents | BlobResourceContents;
};

type SamplingContentBlock =
  | SamplingTextContentBlock
  | ImageContent
  | AudioContent
  | SamplingResourceContentBlock;

const toSamplingResourceUri = (attachment: PlaygroundAttachment) => {
  const safeName = encodeURIComponent(attachment.filename || attachment.id || "attachment");
  return `file:///playground/${safeName}`;
};

const toSamplingFileResource = (
  attachment: PlaygroundAttachment,
): TextResourceContents | BlobResourceContents | undefined => {
  const uri = toSamplingResourceUri(attachment);
  const mimeType = attachment.mimeType || "application/octet-stream";

  if (attachment.documentKind === "text" && typeof attachment.textContent === "string") {
    return {
      uri,
      mimeType,
      text: attachment.textContent,
    };
  }

  if (typeof attachment.base64 === "string" && attachment.base64.length > 0) {
    return {
      uri,
      mimeType,
      blob: attachment.base64,
    };
  }

  return undefined;
};

const toSamplingAttachmentContentBlocks = (
  attachment: PlaygroundAttachment,
): SamplingContentBlock[] => {
  if (attachment.kind === "image") {
    const parsed = attachment.dataUrl ? parseDataUrl(attachment.dataUrl) : undefined;
    if (!parsed?.data) return [];

    return [{
      type: "image",
      data: parsed.data,
      mimeType: parsed.mediaType,
    } satisfies ImageContent];
  }

  if (attachment.kind === "audio") {
    if (!attachment.base64) return [];

    return [{
      type: "audio",
      data: attachment.base64,
      mimeType: attachment.mimeType || "application/octet-stream",
    } satisfies AudioContent];
  }

  if (attachment.kind === "file") {
    const resource = toSamplingFileResource(attachment);
    if (!resource) return [];

    return [{
      type: "resource",
      resource,
    }];
  }

  return [];
};

const parseDataUrl = (dataUrl: string): { mediaType: string; data: string } | undefined => {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/i);
  if (!match) return undefined;

  return {
    mediaType: match[1] || "application/octet-stream",
    data: match[2] || "",
  };
};

const toAnthropicAttachmentContentBlocks = (
  attachment: PlaygroundAttachment,
): AnthropicMessageContentBlock[] => {
  if (attachment.kind === "image" && attachment.dataUrl) {
    const parsed = parseDataUrl(attachment.dataUrl);
    if (!parsed?.data) return [];

    return [{
      type: "image",
      source: {
        type: "base64",
        media_type: parsed.mediaType,
        data: parsed.data,
      },
    }];
  }

  if (attachment.kind !== "file") return [];

  if (attachment.documentKind === "pdf" && attachment.base64) {
    return [{
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: attachment.base64,
      },
      title: attachment.filename,
    }];
  }

  if (attachment.documentKind === "text" && attachment.textContent) {
    return [{
      type: "document",
      source: {
        type: "text",
        media_type: "text/plain",
        data: attachment.textContent,
      },
      title: attachment.filename,
    }];
  }

  return [];
};

export const toAnthropicMessages = (messages: PlaygroundMessage[]) => {
  const normalized = normalizeMessages(messages);
  return normalized
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.role === "assistant"
        ? [{ type: "text" as const, text: message.content }]
        : [
          ...inputTextBlock(message.content),
          ...message.attachments.flatMap(toAnthropicAttachmentContentBlocks),
        ],
    }));
};

export const getSystemPrompt = (messages: PlaygroundMessage[]) =>
  normalizeMessages(messages).find((message) => message.role === "system")?.content;

export const toSamplingCreateMessageRequest = (
  request: NormalizedInvokeRequest,
): CreateMessageRequest["params"] => ({
  messages: request.messages
    .filter((message) => message.role !== "system")
    .map((message): SamplingMessage => {
      const content = (message.role === "assistant"
        ? [{ type: "text", text: message.content } satisfies SamplingTextContentBlock]
        : [
          ...(message.content.length > 0
            ? [{ type: "text", text: message.content } satisfies SamplingTextContentBlock]
            : []),
          ...message.attachments.flatMap(toSamplingAttachmentContentBlocks),
        ]) as SamplingContentBlock[];

      return {
        role: message.role as "user" | "assistant",
        content: content as SamplingMessageContent,
      };
    }),
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
      attachments: Array.isArray(message.attachments)
        ? message.attachments.filter((attachment) => isSerializableAttachment(attachment))
        : [],
    }))
    .filter((message) => message.content.length > 0 || message.attachments.length > 0);

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

const isSerializableAttachment = (attachment: PlaygroundAttachment | undefined): attachment is PlaygroundAttachment => {
  if (!attachment?.id || !attachment?.filename || !attachment?.kind) return false;

  if (attachment.kind === "image") {
    return typeof attachment.dataUrl === "string" && attachment.dataUrl.length > 0;
  }

  if (attachment.kind === "audio") {
    return typeof attachment.base64 === "string"
      && attachment.base64.length > 0
      && (attachment.audioFormat === "wav" || attachment.audioFormat === "mp3");
  }

  return typeof attachment.base64 === "string" && attachment.base64.length > 0;
};

const toChatCompletionAudioFormat = (attachment: PlaygroundAttachment): "wav" | "mp3" | undefined => {
  if (attachment.audioFormat === "wav" || attachment.audioFormat === "mp3") {
    return attachment.audioFormat;
  }

  const mimeType = String(attachment.mimeType ?? "").toLowerCase();
  if (mimeType.includes("wav") || mimeType.includes("wave")) return "wav";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  return undefined;
};

const toInlineFileData = (attachment: PlaygroundAttachment): string | undefined => {
  if (typeof attachment.dataUrl === "string" && attachment.dataUrl.length > 0) {
    return attachment.dataUrl;
  }

  if (typeof attachment.base64 === "string" && attachment.base64.length > 0) {
    const mimeType = attachment.mimeType || "application/octet-stream";
    return `data:${mimeType};base64,${attachment.base64}`;
  }

  return undefined;
};

export const toChatCompletionsMessages = (messages: PlaygroundMessage[]) =>
  normalizeMessages(messages).map((message) => {
    if (message.role !== "user") {
      return {
        role: message.role,
        content: message.content,
      };
    }

    const contentParts: any[] = [];

    if (message.content.length > 0) {
      contentParts.push({ type: "text", text: message.content });
    }

    message.attachments.forEach((attachment) => {
      if (attachment.kind === "image" && attachment.dataUrl) {
        contentParts.push({
          type: "image_url",
          image_url: {
            url: attachment.dataUrl,
          },
        });
        return;
      }

      if (attachment.kind === "audio" && attachment.base64) {
        const format = toChatCompletionAudioFormat(attachment);
        if (!format) return;

        contentParts.push({
          type: "input_audio",
          input_audio: {
            data: attachment.base64,
            format,
          },
        });
        return;
      }

      if (attachment.base64) {
        const fileData = toInlineFileData(attachment);
        if (!fileData) return;

        contentParts.push({
          type: "file",
          file: {
            file_data: fileData,
            filename: attachment.filename,
          },
        });
      }
    });

    return {
      role: "user" as const,
      content: contentParts.length === 1 && contentParts[0]?.type === "text"
        ? message.content
        : contentParts,
    };
  });

export const toResponsesConversationInput = (
  messages: PlaygroundMessage[],
): {
  instructions?: string;
  input: ResponsesConversationItem[];
} => {
  const normalized = normalizeMessages(messages);
  const instructions = normalized.find((message) => message.role === "system")?.content;
  const input: ResponsesConversationItem[] = normalized
    .filter((message): message is NormalizedResponsesConversationMessage => message.role !== "system")
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.role === "assistant"
        ? outputTextMessageContent(message.content)
        : [
          ...(message.content.length > 0 ? inputTextMessageContent(message.content) : []),
          ...message.attachments.flatMap<ResponsesImageContentPart | ResponsesFileContentPart>((attachment) => {
            if (attachment.kind === "image" && attachment.dataUrl) {
              return [{ type: "input_image" as const, image_url: attachment.dataUrl }];
            }

            if (attachment.kind === "file" && attachment.base64) {
              const fileData = toInlineFileData(attachment);
              if (!fileData) return [];

              return [{
                type: "input_file" as const,
                file_data: fileData,
                filename: attachment.filename,
              }];
            }

            return [];
          }),
        ],
    }));

  return {
    instructions,
    input,
  };
};

