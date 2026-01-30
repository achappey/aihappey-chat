import type { JsonRenderAppDataSource } from "aihappey-json-render-apps";
import type { StructuredOutputsItem } from "aihappey-structured-outputs";
import { createBackendProvider, generateText, jsonSchema, Output } from "aihappey-ai";
import { readResource } from "../../runtime/mcp/readResource";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import type { Resource, ResourceTemplate } from "aihappey-state";
import { mcpRuntime } from "aihappey-state";

export type DataSourceRefreshContext = {
  dataSource: JsonRenderAppDataSource;
  mcpServers: Record<string, { connected: boolean }>;
  mcpServerContent: Record<string, { tools?: Tool[] }>;
  tools: Tool[];
  structuredOutputs: StructuredOutputsItem[];
  customHeaders?: Record<string, string>;
  apiBaseUrl?: string;
  getAccessToken?: () => Promise<string>;
};

const templateParamRegex = /{([^{}]+)}/g;

export const extractTemplateParams = (template: string) => {
  const raw = String(template ?? "");
  const params = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = templateParamRegex.exec(raw))) {
    const key = match[1]?.trim();
    if (key) params.add(key);
  }
  return Array.from(params.values());
};

export const applyTemplateParams = (
  template: string,
  params: Record<string, any> | undefined
) => {
  const safeParams = params ?? {};
  return String(template ?? "").replace(templateParamRegex, (_full, key) => {
    const value = safeParams[key?.trim?.() ?? ""];
    return value == null ? "" : String(value);
  });
};

const normalizeToolResult = (result: any) => {
  if (result == null) return result;
  if (typeof result === "object") {
    if (result.structuredContent !== undefined) return result.structuredContent;
    if (Array.isArray(result.content)) {
      const resource = result.content.find((c: any) => c?.type === "resource")?.resource;
      if (resource?.mimeType === "application/json" && typeof resource.text === "string") {
        try {
          return JSON.parse(resource.text);
        } catch {
          return resource.text;
        }
      }
    }
  }
  return result;
};

const parseJsonContent = (text?: string) => {
  if (typeof text !== "string") return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

const readResourceJson = async (serverKey: string, uri: string) => {
  const result = await readResource(serverKey, uri);
  const contents = Array.isArray((result as any)?.contents)
    ? (result as any).contents
    : [];

  for (const item of contents) {
    if (item?.mimeType === "application/json" && typeof item?.text === "string") {
      const parsed = parseJsonContent(item.text);
      if (parsed !== undefined) return parsed;
    }
  }

  throw new Error("No JSON content found in resource.");
};

const fetchJsonUrl = async (url: string) => {
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch (${res.status}).`);
  }
  return await res.json();
};

export const refreshDataSource = async (ctx: DataSourceRefreshContext) => {
  const { dataSource, apiBaseUrl, customHeaders, getAccessToken } = ctx;

  switch (dataSource.type) {
    case "url": {
      const url = applyTemplateParams(dataSource.config.url, dataSource.config.params);
      return await fetchJsonUrl(url);
    }

    case "resource": {
      const { serverKey, uri } = dataSource.config;
      if (!mcpRuntime.has(serverKey)) {
        throw new Error("MCP server is not connected.");
      }
      return await readResourceJson(serverKey, uri);
    }

    case "resourceTemplate": {
      const { serverKey, uriTemplate, params } = dataSource.config;
      if (!mcpRuntime.has(serverKey)) {
        throw new Error("MCP server is not connected.");
      }
      const resolved = applyTemplateParams(uriTemplate, params);
      return await readResourceJson(serverKey, resolved);
    }

    case "tool": {
      const { name, params } = dataSource.config;
      const serverName = Object.keys(ctx.mcpServerContent).find(
        (srv) =>
          mcpRuntime.has(srv) &&
          (ctx.mcpServerContent[srv]?.tools ?? []).some((t) => t.name === name)
      );

      if (!serverName) {
        throw new Error("Tool is not available from connected servers.");
      }

      const client = mcpRuntime.get(serverName);
      if (!client) throw new Error("MCP server is not connected.");

      const result = await client.callTool({
        name,
        arguments: params ?? {},
      } as any);
      return normalizeToolResult(result);
    }

    case "structuredOutput": {
      const { schema, prompt, model } = dataSource.config;
      if (!apiBaseUrl) throw new Error("AI backend is not configured.");

      const provider = createBackendProvider(
        new URL(apiBaseUrl).hostname,
        apiBaseUrl,
        { ...(customHeaders ?? {}) },
        getAccessToken
      );

      const modelId = model && model.trim().length ? model : "openai/gpt-5-mini";
      const aiModel = provider(modelId);
      const parsedSchema = schema ?? {};
      const json = jsonSchema(parsedSchema);

      const result = await generateText({
        model: aiModel,
        prompt,
        output: Output.object({ schema: json }),
        tools: {},
      });

      return result.output ?? result;
    }

    default:
      throw new Error("Unsupported data source.");
  }
};

export const buildResourceOptions = (
  resources: Array<{ serverKey: string; resource: Resource }>
) =>
  resources.map((item) => ({
    key: `${item.serverKey}:${item.resource.uri}`,
    label: item.resource.title ?? item.resource.name ?? item.resource.uri,
    serverKey: item.serverKey,
    uri: item.resource.uri,
  }));

export const buildResourceTemplateOptions = (
  templates: Array<{ serverKey: string; resourceTemplate: ResourceTemplate }>
) =>
  templates.map((item) => ({
    key: `${item.serverKey}:${item.resourceTemplate.uriTemplate}`,
    label: item.resourceTemplate.title ?? item.resourceTemplate.name ?? item.resourceTemplate.uriTemplate,
    serverKey: item.serverKey,
    uriTemplate: item.resourceTemplate.uriTemplate,
  }));

export const buildToolOptions = (tools: Tool[]) =>
  tools.map((tool) => ({
    key: tool.name,
    label: tool.title ?? tool.name,
    name: tool.name,
    inputSchema: tool.inputSchema ?? { type: "object", properties: {} },
  }));

export const buildStructuredOutputOptions = (items: StructuredOutputsItem[]) =>
  items.map((item) => {
    let schema: any = {};
    try {
      schema = JSON.parse(item.json_schema);
    } catch {
      schema = {};
    }
    return { key: item.id, label: item.name, schema };
  });

export const buildModelOptions = (models: Array<{ id: string }>) =>
  models.map((model) => ({ key: model.id, label: model.id }));
