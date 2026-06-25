export type PlaygroundRole = "system" | "user" | "assistant";

export type PlaygroundAttachmentKind = "image" | "audio" | "file";

export type PlaygroundAttachmentDocumentKind = "pdf" | "text";

export type PlaygroundAttachment = {
  id: string;
  kind: PlaygroundAttachmentKind;
  filename: string;
  mimeType?: string;
  dataUrl?: string;
  base64?: string;
  audioFormat?: "wav" | "mp3";
  documentKind?: PlaygroundAttachmentDocumentKind;
  textContent?: string;
};

export type PlaygroundMessage = {
  role: PlaygroundRole;
  content: string;
  attachments?: PlaygroundAttachment[];
};

export type PlaygroundClientId = "vercel-ai-sdk" | "openai" | "anthropic" | "fetch";

export type PlaygroundEndpointId =
  | "/api/chat"
  | "/v1/chat/completions"
  | "/v1/responses"
  | "/v1/messages"
  | "/sampling";

export type PlaygroundClientOption = {
  id: string;
  label: string;
  endpoint: PlaygroundEndpointId | string;
  client: PlaygroundClientId;
};

export type ChatCompletionsEndpointConfig = {
  stream?: boolean;
  n?: number;
  top_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  store?: boolean;
  parallel_tool_calls?: boolean;
  user?: string;
  service_tier?: string;
  reasoning_effort?: string;
  verbosity?: string;
};

export type ResponsesEndpointConfig = {
  stream?: boolean;
  store?: boolean;
  top_p?: number;
  truncation?: string;
  imageInputDetail?: "low" | "high" | "auto" | "original";
  context_management?: Array<{
    type?: "compaction" | string;
    compact_threshold?: number;
  }>;
  parallel_tool_calls?: boolean;
  background?: boolean;
  max_tool_calls?: number;
  include?: string[]
  user?: string;
  service_tier?: string;
  prompt_cache_key?: string;
  prompt_cache_retention?: string;
  safety_identifier?: string;
  reasoning?: {
    effort?: string;
    summary?: string;
  };
  text?: {
    verbosity?: string;
  };
};

export type MessagesEndpointConfig = {
  stream?: boolean;
  top_p?: number;
  top_k?: number;
  service_tier?: string;
  container?: string;
  inference_geo?: string;
  stop_sequences?: string[];
  metadata?: {
    user_id?: string;
  };
  output_config?: {
    effort?: string;
  };
  thinking?: {
    type?: string;
    budget_tokens?: number;
    display?: string;
  };
};

export type PlaygroundEndpointConfigMap = {
  "/api/chat"?: Record<string, never>;
  "/v1/chat/completions"?: ChatCompletionsEndpointConfig;
  "/v1/responses"?: ResponsesEndpointConfig;
  "/v1/messages"?: MessagesEndpointConfig;
  "/sampling"?: Record<string, never>;
};

export type InvokePlaygroundRequest = {
  optionId: string;
  baseUrl: string;
  model: string;
  messages: PlaygroundMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  providerMetadata?: any;
  providerRequestConfig?: Record<string, any>;
  omitProviderMetadataInNativeMetadata?: boolean;
  endpointConfig?: unknown;
  headers?: Record<string, string>;
  getAccessToken?: () => Promise<string>;
};

export type PlaygroundInspection = {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  requestBody?: unknown;
  responseBody?: unknown;
};

export type InvokePlaygroundResult = {
  text: string;
  raw?: unknown;
  inspection?: PlaygroundInspection;
};

export type PreparedPlaygroundInvocation = {
  option: PlaygroundClientOption;
  endpoint: EndpointAdapter;
  client?: ClientAdapter;
  request: NormalizedInvokeRequest;
  prepared: PreparedEndpointRequest;
};

export type NormalizedPlaygroundMessage = {
  role: PlaygroundRole;
  content: string;
  attachments: PlaygroundAttachment[];
};

export type NormalizedInvokeRequest = Omit<InvokePlaygroundRequest, "messages"> & {
  messages: NormalizedPlaygroundMessage[];
};

export type PreparedEndpointRequest = {
  endpointId: PlaygroundEndpointId | string;
  method: "POST";
  path: string;
  body: unknown;
  parseResponse: (raw: unknown) => InvokePlaygroundResult;
};

export type EndpointAdapter = {
  id: PlaygroundEndpointId | string;
  label: string;
  buildRequest: (request: NormalizedInvokeRequest) => PreparedEndpointRequest;
};

export type ClientAdapter = {
  id: PlaygroundClientId;
  label: string;
  supportsEndpoint: (endpoint: EndpointAdapter) => boolean;
  invoke: (args: {
    endpoint: EndpointAdapter;
    prepared: PreparedEndpointRequest;
    request: NormalizedInvokeRequest;
  }) => Promise<InvokePlaygroundResult>;
};

