
export type McpRegistryServerResponse = {
  server: McpRegistryServer;
  _meta?: Record<string, Record<string, any>> | null
};

export type McpRegistryServer = {
  name: string;
  title?: string;
  description?: string;
  websiteUrl?: string;
  version: string;
  repository?: any
  icons?: any[]
  headers?: Record<string, string>
  _meta?: Record<string, Record<string, any>>
  remotes?: McpServerRemote[]
};

export type McpRegistryInput = {
  choices?: string[] | null;
  default?: string;
  description?: string;
  placeholder?: string;
  value?: string;
  isRequired?: boolean;
  isSecret?: boolean;
  format?: "string" | "number" | "boolean" | "filepath";
};

export type McpRegistryHeader = McpRegistryInput & {
  name: string;
  variables?: Record<string, McpRegistryInput> | null;
};

export type McpServerRemote = {
  type: "streamable-http" | "sse";
  url: string;
  headers?: McpRegistryHeader[] | null;
};


export type ServerClientConfig = {
  type: "http" | "sse";
  url: string;
  disabled?: boolean;
  headers?: Record<string, string>
  alwaysAllow?: string[]
};


export const AGENT_RESOURCE_TYPE = "application/vnd.agent+json"
export const AGENTS_RESOURCE_TYPE = "application/vnd.agents+json"
export const CONVERSATION_RESOURCE_TYPE = "application/vnd.conversation+json"
export const CONVERSATIONS_RESOURCE_TYPE = "application/vnd.conversations+json"

