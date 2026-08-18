export type JsonObject = Record<string, unknown>;

export type PluginAuthor = {
  name?: string;
  email?: string;
  url?: string;
};

export type PluginManifest = {
  $schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
  name: string;
  version?: string;
  description?: string;
  author?: PluginAuthor;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  /** Unknown namespaces are deliberately kept opaque. */
  extensions?: Record<string, unknown>;
};

export type PluginStdioMcpServer = {
  type: "stdio";
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
};

export type PluginHttpMcpServer = {
  type: "streamable-http" | "sse";
  url: string;
  headers?: Record<string, string>;
};

export type PluginMcpServer = PluginStdioMcpServer | PluginHttpMcpServer;

export type PluginMcpConfiguration = {
  $schema: "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json";
  mcpServers: Record<string, PluginMcpServer>;
};

export type PluginServerExtension = {
  allowed_callers?: Array<"direct" | "programmatic">;
  defer_loading?: boolean;
  namespace?: boolean;
};

export type PluginClientExtension = {
  mcpServers?: Record<string, PluginServerExtension>;
};

export type PluginDiagnosticSeverity = "error" | "warning" | "info";
export type PluginDiagnosticBoundary = "plugin" | "manifest" | "skills" | "skill" | "mcp" | "server" | "extension";

export type PluginDiagnostic = {
  severity: PluginDiagnosticSeverity;
  boundary: PluginDiagnosticBoundary;
  code: string;
  message: string;
  path?: string;
  entry?: string;
};

export type StoredPluginFile = {
  path: string;
  data: Blob;
  size: number;
  mediaType?: string;
};

export type StoredPluginSkill = {
  name: string;
  description: string;
  directory: string;
  entryPath: string;
  fileCount: number;
  valid: boolean;
};

export type StoredPlugin = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  manifest: PluginManifest;
  mcp?: PluginMcpConfiguration;
  files: StoredPluginFile[];
  skills: StoredPluginSkill[];
  diagnostics: PluginDiagnostic[];
};

export type PluginCatalogItem = {
  id: string;
  name: string;
  description: string;
  version?: string;
  author?: PluginAuthor;
  homepage?: string;
  repository?: string;
  keywords: string[];
  skillCount: number;
  mcpServerCount: number;
  unsupportedServerCount: number;
  diagnosticCount: number;
  createdAt: number;
  updatedAt: number;
};

export type PluginDraft = {
  manifest: PluginManifest;
  mcpServers?: Record<string, PluginMcpServer>;
  /** Complete package files except generated root plugin.json and mcp.json. */
  files: StoredPluginFile[];
};

export type PluginImportResult = {
  imported: StoredPlugin[];
  diagnostics: PluginDiagnostic[];
};

export type PluginArchiveExport = {
  filename: string;
  blob: Blob;
};

export type PluginValidationResult<T> = {
  value?: T;
  diagnostics: PluginDiagnostic[];
};

export type PluginStore = {
  readonly kind: "indexeddb";
  list(): Promise<PluginCatalogItem[]>;
  read(id: string): Promise<StoredPlugin | undefined>;
  create(draft: PluginDraft): Promise<StoredPlugin>;
  update(id: string, draft: PluginDraft): Promise<StoredPlugin>;
  delete(id: string): Promise<void>;
  importArchive(file: Blob): Promise<PluginImportResult>;
  exportArchive(id: string): Promise<PluginArchiveExport | undefined>;
};

export type PluginsConfig = {
  /** Reverse-domain namespace used only for this client's optional MCP settings. */
  extensionNamespace?: string;
};
