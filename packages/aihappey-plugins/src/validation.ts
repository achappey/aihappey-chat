import {
  EXTENSION_NAMESPACE_PATTERN,
  PLUGIN_MANIFEST_FIELDS,
  PLUGIN_MCP_SCHEMA_URL,
  PLUGIN_NAME_PATTERN,
  PLUGIN_SCHEMA_URL,
} from "./constants";
import type {
  JsonObject,
  PluginClientExtension,
  PluginDiagnostic,
  PluginManifest,
  PluginMcpConfiguration,
  PluginMcpServer,
  PluginServerExtension,
  PluginValidationResult,
} from "./types";

const HEADER_NAME_RE = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const AUTHOR_FIELDS = new Set(["name", "email", "url"]);
const STDIO_FIELDS = new Set(["type", "command", "args", "env", "cwd"]);
const HTTP_FIELDS = new Set(["type", "url", "headers"]);

export const isObject = (value: unknown): value is JsonObject =>
  !!value && typeof value === "object" && !Array.isArray(value);

const diagnostic = (
  severity: PluginDiagnostic["severity"],
  boundary: PluginDiagnostic["boundary"],
  code: string,
  message: string,
  extra?: Pick<PluginDiagnostic, "path" | "entry">
): PluginDiagnostic => ({ severity, boundary, code, message, ...extra });

export function isValidExtensionNamespace(value: unknown): value is string {
  return typeof value === "string" && value.length <= 253 && EXTENSION_NAMESPACE_PATTERN.test(value);
}

export function validatePluginManifest(input: unknown): PluginValidationResult<PluginManifest> {
  const diagnostics: PluginDiagnostic[] = [];
  if (!isObject(input)) {
    return { diagnostics: [diagnostic("error", "manifest", "manifest-not-object", "plugin.json must contain a JSON object.", { path: "plugin.json" })] };
  }

  for (const field of Object.keys(input)) {
    if (!PLUGIN_MANIFEST_FIELDS.has(field)) {
      diagnostics.push(diagnostic("warning", "manifest", "manifest-unknown-field", `Unknown plugin.json field '${field}' was ignored.`, { path: "plugin.json" }));
    }
  }

  if (input.$schema !== PLUGIN_SCHEMA_URL) {
    diagnostics.push(diagnostic("error", "manifest", "manifest-unsupported-schema", "plugin.json targets an unsupported Agent Plugins schema.", { path: "plugin.json" }));
  }
  if (typeof input.name !== "string" || input.name.length < 1 || input.name.length > 64 || !PLUGIN_NAME_PATTERN.test(input.name)) {
    diagnostics.push(diagnostic("error", "manifest", "manifest-invalid-name", "Plugin name must be 1–64 lowercase letters, digits, hyphens, or periods without repeated separators.", { path: "plugin.json" }));
  }

  for (const field of ["version", "description", "homepage", "repository", "license"] as const) {
    if (input[field] !== undefined && typeof input[field] !== "string") {
      diagnostics.push(diagnostic("error", "manifest", `manifest-invalid-${field}`, `${field} must be a string.`, { path: "plugin.json" }));
    }
  }

  let author: PluginManifest["author"];
  if (input.author !== undefined) {
    if (!isObject(input.author)) {
      diagnostics.push(diagnostic("error", "manifest", "manifest-invalid-author", "author must be an object.", { path: "plugin.json" }));
    } else {
      const invalid = Object.entries(input.author).some(([key, value]) => !AUTHOR_FIELDS.has(key) || typeof value !== "string");
      if (invalid) diagnostics.push(diagnostic("error", "manifest", "manifest-invalid-author", "author may contain only string name, email, and url fields.", { path: "plugin.json" }));
      else author = input.author as PluginManifest["author"];
    }
  }

  let keywords: string[] | undefined;
  if (input.keywords !== undefined) {
    if (!Array.isArray(input.keywords) || input.keywords.some((item) => typeof item !== "string")) {
      diagnostics.push(diagnostic("error", "manifest", "manifest-invalid-keywords", "keywords must be an array of strings.", { path: "plugin.json" }));
    } else keywords = input.keywords;
  }

  let extensions: Record<string, unknown> | undefined;
  if (input.extensions !== undefined) {
    if (!isObject(input.extensions)) {
      diagnostics.push(diagnostic("warning", "extension", "manifest-invalid-extensions", "The non-object extensions field was ignored.", { path: "plugin.json" }));
    } else extensions = { ...input.extensions };
  }

  if (diagnostics.some((item) => item.severity === "error")) return { diagnostics };
  return {
    diagnostics,
    value: {
      $schema: PLUGIN_SCHEMA_URL,
      name: input.name as string,
      ...(input.version !== undefined ? { version: input.version as string } : {}),
      ...(input.description !== undefined ? { description: input.description as string } : {}),
      ...(author ? { author } : {}),
      ...(input.homepage !== undefined ? { homepage: input.homepage as string } : {}),
      ...(input.repository !== undefined ? { repository: input.repository as string } : {}),
      ...(input.license !== undefined ? { license: input.license as string } : {}),
      ...(keywords ? { keywords } : {}),
      ...(extensions ? { extensions } : {}),
    },
  };
}

function hasOnlyFields(value: JsonObject, allowed: Set<string>) {
  return Object.keys(value).every((field) => allowed.has(field));
}

function safePluginPath(value: string) {
  const normalized = value.replace(/\\/g, "/");
  const parts = normalized.split("/");
  return normalized.startsWith("./") && !parts.includes("..") && !normalized.includes("\0");
}

function validCwd(value: string) {
  if (safePluginPath(value)) return true;
  for (const root of ["${PLUGIN_ROOT}", "${PLUGIN_DATA}"]) {
    if (value === root) return true;
    if (value.startsWith(`${root}/`)) return !value.slice(root.length + 1).split("/").includes("..");
  }
  return false;
}

function validateRemoteUrl(value: unknown) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.hash || !["http:", "https:"].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    const loopback = host === "localhost" || host === "127.0.0.1" || host === "::1" || host.startsWith("127.");
    return url.protocol === "https:" || loopback;
  } catch {
    return false;
  }
}

function validateHeaders(value: unknown) {
  if (value === undefined) return true;
  if (!isObject(value)) return false;
  const seen = new Set<string>();
  for (const [name, headerValue] of Object.entries(value)) {
    const lower = name.toLowerCase();
    if (!HEADER_NAME_RE.test(name) || seen.has(lower) || typeof headerValue !== "string" || /[\r\n]/.test(headerValue)) return false;
    seen.add(lower);
  }
  return true;
}

export function validateMcpServer(name: string, input: unknown): PluginValidationResult<PluginMcpServer> {
  const fail = (code: string, message: string): PluginValidationResult<PluginMcpServer> => ({
    diagnostics: [diagnostic("error", "server", code, message, { path: "mcp.json", entry: name })],
  });
  if (!isObject(input) || typeof input.type !== "string") return fail("server-invalid", `MCP server '${name}' must be an object with a type.`);

  if (input.type === "stdio") {
    if (!hasOnlyFields(input, STDIO_FIELDS) || typeof input.command !== "string" || !input.command.trim()) return fail("server-invalid-stdio", `stdio server '${name}' has invalid or unknown fields.`);
    if (input.command.includes("/") && !safePluginPath(input.command)) return fail("server-unsafe-command", `stdio server '${name}' command must be a bare executable or safe ./ path.`);
    if (input.args !== undefined && (!Array.isArray(input.args) || input.args.some((item) => typeof item !== "string"))) return fail("server-invalid-args", `stdio server '${name}' args must be strings.`);
    if (input.env !== undefined && (!isObject(input.env) || Object.entries(input.env).some(([key, value]) => ["PLUGIN_ROOT", "PLUGIN_DATA"].includes(key) || typeof value !== "string"))) return fail("server-invalid-env", `stdio server '${name}' env is invalid or overrides a reserved variable.`);
    if (input.cwd !== undefined && (typeof input.cwd !== "string" || !validCwd(input.cwd))) return fail("server-invalid-cwd", `stdio server '${name}' cwd is unsafe.`);
    return {
      value: input as PluginMcpServer,
      diagnostics: [diagnostic("info", "server", "server-unsupported-transport", `stdio server '${name}' is preserved but cannot run in this browser client.`, { path: "mcp.json", entry: name })],
    };
  }

  if (input.type === "streamable-http" || input.type === "sse") {
    if (!hasOnlyFields(input, HTTP_FIELDS) || !validateRemoteUrl(input.url) || !validateHeaders(input.headers)) return fail("server-invalid-http", `Remote MCP server '${name}' has invalid or unknown fields, URL, or headers.`);
    return {
      value: input as PluginMcpServer,
      diagnostics: input.type === "sse"
        ? [diagnostic("info", "server", "server-unsupported-transport", `Legacy SSE server '${name}' is preserved but cannot run in this browser client.`, { path: "mcp.json", entry: name })]
        : [],
    };
  }

  return fail("server-unknown-transport", `MCP server '${name}' declares an unknown transport.`);
}

export function validateMcpConfiguration(input: unknown, pluginSchema = PLUGIN_SCHEMA_URL): PluginValidationResult<PluginMcpConfiguration> {
  const diagnostics: PluginDiagnostic[] = [];
  if (!isObject(input) || !hasOnlyFields(input, new Set(["$schema", "mcpServers"])) || input.$schema !== PLUGIN_MCP_SCHEMA_URL || !isObject(input.mcpServers)) {
    return { diagnostics: [diagnostic("error", "mcp", "mcp-invalid-document", "mcp.json must use the supported schema and contain only $schema and mcpServers.", { path: "mcp.json" })] };
  }
  if (pluginSchema !== PLUGIN_SCHEMA_URL) {
    return { diagnostics: [diagnostic("error", "mcp", "mcp-schema-mismatch", "plugin.json and mcp.json target different Agent Plugins versions.", { path: "mcp.json" })] };
  }
  const mcpServers: Record<string, PluginMcpServer> = {};
  for (const [name, server] of Object.entries(input.mcpServers)) {
    const result = validateMcpServer(name, server);
    diagnostics.push(...result.diagnostics);
    if (result.value) mcpServers[name] = result.value;
  }
  return { value: { $schema: PLUGIN_MCP_SCHEMA_URL, mcpServers }, diagnostics };
}

export function readClientExtension(manifest: PluginManifest, namespace?: string): PluginClientExtension | undefined {
  if (!namespace || !isValidExtensionNamespace(namespace)) return undefined;
  const value = manifest.extensions?.[namespace];
  if (!isObject(value)) return undefined;
  const servers = isObject(value.mcpServers) ? value.mcpServers : undefined;
  if (!servers) return {};
  const mcpServers: Record<string, PluginServerExtension> = {};
  for (const [name, entry] of Object.entries(servers)) {
    if (!isObject(entry)) continue;
    const callers = Array.isArray(entry.allowed_callers)
      ? entry.allowed_callers.filter((item): item is "direct" | "programmatic" => item === "direct" || item === "programmatic")
      : undefined;
    mcpServers[name] = {
      ...(typeof entry.disabled === "boolean" ? { disabled: entry.disabled } : {}),
      ...(callers?.length ? { allowed_callers: callers } : {}),
      ...(typeof entry.defer_loading === "boolean" ? { defer_loading: entry.defer_loading } : {}),
    };
  }
  return { mcpServers };
}

export function writeClientExtension(
  manifest: PluginManifest,
  namespace: string | undefined,
  serverSettings: Record<string, PluginServerExtension> | undefined
): PluginManifest {
  if (!namespace || !isValidExtensionNamespace(namespace)) return manifest;
  const extensions = { ...(manifest.extensions ?? {}) };
  const existing = isObject(extensions[namespace]) ? extensions[namespace] as JsonObject : {};
  const cleaned = Object.fromEntries(Object.entries(serverSettings ?? {}).flatMap(([name, value]) => {
    const entry = {
      ...(typeof value.disabled === "boolean" ? { disabled: value.disabled } : {}),
      ...(value.allowed_callers?.length ? { allowed_callers: value.allowed_callers } : {}),
      ...(typeof value.defer_loading === "boolean" ? { defer_loading: value.defer_loading } : {}),
    };
    return Object.keys(entry).length ? [[name, entry]] : [];
  }));
  extensions[namespace] = { ...existing, mcpServers: cleaned };
  return { ...manifest, extensions };
}
