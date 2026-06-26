import type { PlaygroundAttachment, PreparedPlaygroundInvocation } from "aihappey-clients";
import type { UIMessage } from "aihappey-ai";

export type PlaygroundPayloadMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  attachments?: PlaygroundAttachment[];
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const resolvePlaygroundUrl = (baseUrl: string, endpoint: string) => {
  const base = trimTrailingSlash(baseUrl || "");
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};

export const createPlaygroundUiMessage = (
  role: "system" | "user" | "assistant",
  text: string,
  attachments?: PlaygroundAttachment[],
): UIMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  role,
  parts: [{ type: "text", text } as any],
  metadata: {
    timestamp: new Date().toISOString(),
    playgroundAttachments: attachments,
  },
} as UIMessage);

const toPlaygroundApiChatAttachmentPart = (attachment: PlaygroundAttachment) => {
  const url = typeof attachment.dataUrl === "string" && attachment.dataUrl.length > 0
    ? attachment.dataUrl
    : typeof attachment.base64 === "string" && attachment.base64.length > 0
      ? `data:${attachment.mimeType || "application/octet-stream"};base64,${attachment.base64}`
      : undefined;

  if (!url) return undefined;

  return {
    type: "file" as const,
    filename: attachment.filename,
    mediaType: attachment.mimeType || "application/octet-stream",
    url,
  };
};

export const toPlaygroundApiChatMessage = (message: UIMessage): UIMessage => {
  const text = getPlaygroundMessageText(message).trim();
  const attachments = getPlaygroundMessageAttachments(message)
    .map((attachment) => toPlaygroundApiChatAttachmentPart(attachment))
    .filter(Boolean);

  const parts = [
    ...attachments,
    ...(text ? [{ type: "text" as const, text }] : []),
  ];

  return {
    ...message,
    parts: parts.length > 0 ? parts as any : [{ type: "text", text }] as any,
  } as UIMessage;
};

export const toPlaygroundApiChatMessages = (messages: UIMessage[]): UIMessage[] =>
  messages.map((message) => toPlaygroundApiChatMessage(message));

export const replaceLastPlaygroundAssistantMessage = (
  messages: UIMessage[],
  text: string,
): UIMessage[] => {
  const assistantMessage = createPlaygroundUiMessage("assistant", text);
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === "assistant") {
    return [...messages.slice(0, -1), assistantMessage];
  }
  return [...messages, assistantMessage];
};

export const getPlaygroundMessageText = (message: Pick<UIMessage, "parts">) =>
  message.parts
    ?.map((part: any) => part?.text ?? "")
    .filter(Boolean)
    .join("\n\n") ?? "";

export const getPlaygroundMessageAttachments = (message: Pick<UIMessage, "metadata">): PlaygroundAttachment[] => {
  const attachments = (message as any)?.metadata?.playgroundAttachments;
  return Array.isArray(attachments) ? attachments : [];
};

export const createPlaygroundSystemMessage = (systemPrompt?: string): UIMessage | undefined => {
  const text = String(systemPrompt ?? "").trim();
  if (!text) return undefined;
  return createPlaygroundUiMessage("system", text);
};

export const toPlaygroundPayloadMessages = (
  messages: UIMessage[],
  systemPrompt?: string,
): PlaygroundPayloadMessage[] => [
  ...(systemPrompt?.trim()
    ? [{ role: "system" as const, content: systemPrompt.trim() }]
    : []),
  ...messages
    .map((message) => ({
      role: message.role as "system" | "user" | "assistant",
      content: getPlaygroundMessageText(message).trim(),
      attachments: getPlaygroundMessageAttachments(message),
    }))
    .filter((message) => message.content.length > 0 || (message.attachments?.length ?? 0) > 0),
];

export const createPlaygroundFetch = ({
  headers,
  getAccessToken,
  customFetch,
}: {
  headers?: Record<string, string>;
  getAccessToken?: () => Promise<string>;
  customFetch?: typeof fetch;
}) => {
  if (!headers && !getAccessToken && !customFetch) {
    return undefined;
  }

  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const requestHeaders = new Headers(headers ?? {});

    if (getAccessToken) {
      try {
        const token = await getAccessToken();
        if (token) {
          requestHeaders.set("Authorization", `Bearer ${token}`);
        }
      } catch {
        // Ignore token acquisition errors here; the request can still fail normally.
      }
    }

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => {
        requestHeaders.set(key, value);
      });
    }

    return (customFetch ?? fetch)(input, {
      ...init,
      headers: requestHeaders,
    });
  };
};

export const stringifyPlaygroundPreview = (value: unknown) => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const extractTextFromValue = (value: any): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((item) => extractTextFromValue(item)).filter(Boolean).join("");
  }
  if (!value || typeof value !== "object") return "";
  if (typeof value.text === "string") return value.text;
  if (typeof value.output_text === "string") return value.output_text;
  if (typeof value.content === "string") return value.content;
  return "";
};

export const extractPlaygroundStreamText = (endpointId: string, event: any): string => {
  if (!event || typeof event !== "object") return "";

  if (endpointId === "/v1/chat/completions") {
    return event?.choices
      ?.map((choice: any) => extractTextFromValue(choice?.delta?.content))
      .filter(Boolean)
      .join("") ?? "";
  }

  if (endpointId === "/v1/messages") {
    if (event?.type === "content_block_delta") {
      return extractTextFromValue(event?.delta?.text ?? event?.delta);
    }
    return "";
  }

  if (endpointId === "/v1/responses") {
    if (typeof event?.delta === "string") return event.delta;
    if (typeof event?.output_text === "string") return event.output_text;
    return extractTextFromValue(event?.content);
  }

  return "";
};

export const streamPlaygroundResponse = async ({
  invocation,
  fetcher,
  onText,
}: {
  invocation: PreparedPlaygroundInvocation;
  fetcher: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  onText?: (text: string) => void;
}) => {
  const requestHeaders = new Headers(invocation.request.headers ?? {});
  requestHeaders.set("Content-Type", "application/json");
  requestHeaders.set("Accept", "text/event-stream");

  const response = await fetcher(resolvePlaygroundUrl(invocation.request.baseUrl, invocation.prepared.path), {
    method: invocation.prepared.method,
    headers: requestHeaders,
    body: JSON.stringify(invocation.prepared.body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  if (!response.body) {
    throw new Error("Streaming response body is not available.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const events: any[] = [];
  let buffer = "";
  let aggregatedText = "";

  const flushEvent = (rawEvent: string) => {
    const dataLines = rawEvent
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim());

    if (!dataLines.length) return;
    const payload = dataLines.join("\n");
    if (!payload || payload === "[DONE]") return;

    let parsed: any = payload;
    try {
      parsed = JSON.parse(payload);
    } catch {
      // Keep raw payload when JSON parsing fails.
    }

    events.push(parsed);
    const delta = extractPlaygroundStreamText(invocation.endpoint.id, parsed);
    if (delta) {
      aggregatedText += delta;
      onText?.(aggregatedText);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

    let boundaryIndex = buffer.search(/\r?\n\r?\n/);
    while (boundaryIndex >= 0) {
      const rawEvent = buffer.slice(0, boundaryIndex);
      buffer = buffer.slice(boundaryIndex + (buffer[boundaryIndex] === "\r" ? 4 : 2));
      flushEvent(rawEvent);
      boundaryIndex = buffer.search(/\r?\n\r?\n/);
    }

    if (done) break;
  }

  if (buffer.trim()) {
    flushEvent(buffer);
  }

  return {
    text: aggregatedText,
    raw: { events },
  };
};
