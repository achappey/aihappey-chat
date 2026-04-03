import type { UIMessage } from "aihappey-ai";

export type PlaygroundPayloadMessage = {
  role: "system" | "user" | "assistant";
  content: string;
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
): UIMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  role,
  parts: [{ type: "text", text } as any],
  metadata: {
    timestamp: new Date().toISOString(),
  },
} as UIMessage);

export const getPlaygroundMessageText = (message: Pick<UIMessage, "parts">) =>
  message.parts
    ?.map((part: any) => part?.text ?? "")
    .filter(Boolean)
    .join("\n\n") ?? "";

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
    }))
    .filter((message) => message.content.length > 0),
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
