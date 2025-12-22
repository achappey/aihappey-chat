
export type McpRegistryServerResponse = {
  server: McpRegistryServer;
  _meta: Record<string, Record<string, any>>
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

type McpServerRemote = {
  type: "streamable-http" | "sse";
  url: string;
};


export type ServerClientConfig = {
  type: "http" | "sse";
  url: string;
  disabled?: boolean;
  headers?: Record<string, string>
  alwaysAllow?: string[]
};
