export type PlaygroundRole = "system" | "user" | "assistant";

export type PlaygroundMessage = {
  role: PlaygroundRole;
  content: string;
};

export type PlaygroundClientOption = {
  id: string;
  label: string;
  endpoint: string;
  client: "vercel-ai-sdk" | "openai";
};

export type InvokePlaygroundRequest = {
  optionId: string;
  baseUrl: string;
  model: string;
  messages: PlaygroundMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  providerMetadata?: any;
  headers?: Record<string, string>;
  getAccessToken?: () => Promise<string>;
};

export type InvokePlaygroundResult = {
  text: string;
  raw?: unknown;
};
