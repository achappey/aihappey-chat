import { useCallback, useMemo } from "react";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import type { FilesContextType } from "aihappey-files";
import {
  chunkText,
  getVectorStoreChunkCount,
  insertVectorStoreChunks,
  listVectorStoreSources,
  removeVectorStoreSource,
  searchVectorStoreByMode,
  useVectorStores,
  type VectorStore,
  type VectorStoreSearchMode,
} from "aihappey-embeddings";
import { useAppStore } from "aihappey-state";
import { useChatContext } from "../../chat/context/ChatContext";
import { extractTextFromFile } from "../../chat/files/file";
import { createVectorStoreEmbeddingClient } from "../../vector-stores/embeddingClient";
import { readResource as defaultReadResource } from "../../../runtime/mcp/readResource";

type ToolTextResult = {
  isError: boolean;
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: Record<string, unknown>;
};

type Embed = (model: string, values: string[], signal?: AbortSignal) => Promise<number[][]>;

const EMBEDDING_BATCH_SIZE = 32;
const MAX_RESOURCE_PAGES = 100;
const MAX_RESOURCE_CHARACTERS = 10_000_000;

const ok = (value: Record<string, unknown>): ToolTextResult => ({
  isError: false,
  structuredContent: value,
  content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
});

const fail = (reason: unknown): ToolTextResult => ({
  isError: true,
  content: [{ type: "text", text: reason instanceof Error ? reason.message : String(reason) }],
});

const hubReferenceSchema = {
  type: "string",
  description: "Document hub id or exact hub name.",
} as const;

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

function validateChunkSettings(chunkSize: number, chunkOverlap: number) {
  if (!Number.isInteger(chunkSize) || chunkSize < 1) throw new Error("chunkSize must be a positive integer.");
  if (!Number.isInteger(chunkOverlap) || chunkOverlap < 0 || chunkOverlap >= chunkSize) {
    throw new Error("chunkOverlap must be a non-negative integer smaller than chunkSize.");
  }
}

function resolveHub(items: VectorStore[], reference: unknown) {
  const value = String(reference ?? "").trim();
  if (!value) throw new Error("A hubId is required.");
  const hub = items.find((item) => item.id === value)
    ?? items.find((item) => item.name === value);
  if (!hub) throw new Error(`Document hub not found: ${value}`);
  return hub;
}

async function summarizeHub(hub: VectorStore) {
  const sources = await listVectorStoreSources(hub);
  return {
    id: hub.id,
    name: hub.name,
    description: hub.description,
    model: hub.model,
    chunkSize: hub.chunkSize,
    chunkOverlap: hub.chunkOverlap,
    chunkCount: getVectorStoreChunkCount(hub),
    documentCount: sources.length,
  };
}

async function addTextToHub(
  hub: VectorStore,
  filename: string,
  text: string,
  embed: Embed,
  signal?: AbortSignal,
) {
  const normalizedFilename = filename.trim();
  const normalizedText = text.trim();
  if (!normalizedFilename) throw new Error("A filename is required.");
  if (!normalizedText) throw new Error("The document did not contain readable text.");

  const plainChunks = chunkText(normalizedText, hub.chunkSize, hub.chunkOverlap)
    .filter((content) => content.trim())
    .map((content) => ({ filename: normalizedFilename, content }));
  if (!plainChunks.length) throw new Error("The document did not produce any chunks.");

  const chunks: Array<{ filename: string; content: string; embedding: number[] }> = [];
  for (let start = 0; start < plainChunks.length; start += EMBEDDING_BATCH_SIZE) {
    const batch = plainChunks.slice(start, start + EMBEDDING_BATCH_SIZE);
    const vectors = await embed(hub.model, batch.map((chunk) => chunk.content), signal);
    vectors.forEach((embedding, index) => chunks.push({ ...batch[index], embedding }));
  }
  return { hub: await insertVectorStoreChunks(hub, chunks), chunks: chunks.length, characters: normalizedText.length };
}

function resourceCursor(result: any): string | undefined {
  const candidates = [
    result?._meta?.nextCursor,
    result?._meta?.next_cursor,
    result?.nextCursor,
    result?.next_cursor,
  ];
  return candidates.find((value) => typeof value === "string" && value.trim())?.trim();
}

function resourceTexts(result: any): string[] {
  if (!Array.isArray(result?.contents)) return [];
  return result.contents
    .map((content: any) => typeof content?.text === "string" ? content.text.trim() : "")
    .filter(Boolean);
}

export async function readAllResourceText(args: {
  serverName: string;
  uri: string;
  pageLimit?: number;
  readResource?: typeof defaultReadResource;
}) {
  const readResource = args.readResource ?? defaultReadResource;
  const seenCursors = new Set<string>();
  const seenTexts = new Set<string>();
  const collected: string[] = [];
  let cursor: string | undefined;
  let pagesRead = 0;
  let stopReason = "complete";
  let characterCount = 0;

  while (pagesRead < MAX_RESOURCE_PAGES) {
    if (cursor) seenCursors.add(cursor);
    const page = await readResource(args.serverName, args.uri, cursor, args.pageLimit ?? 100);
    pagesRead += 1;
    const texts = resourceTexts(page);
    let newTextCount = 0;
    for (const text of texts) {
      if (seenTexts.has(text)) continue;
      if (characterCount + text.length > MAX_RESOURCE_CHARACTERS) {
        stopReason = "character-limit";
        break;
      }
      seenTexts.add(text);
      collected.push(text);
      characterCount += text.length;
      newTextCount += 1;
    }
    if (stopReason === "character-limit") break;

    const nextCursor = resourceCursor(page);
    if (!nextCursor) break;
    if (seenCursors.has(nextCursor)) {
      stopReason = "repeated-cursor";
      break;
    }
    // A server that advances cursors while returning the same page forever is
    // just as unsafe as one that repeats a cursor. Preserve the unique text
    // already read and terminate without issuing another request.
    if (!texts.length || newTextCount === 0) {
      stopReason = texts.length ? "repeated-content" : "empty-page";
      break;
    }
    cursor = nextCursor;
  }

  if (pagesRead >= MAX_RESOURCE_PAGES && cursor) stopReason = "page-limit";
  return { text: collected.join("\n\n"), pagesRead, textItems: collected.length, stopReason };
}

export const documentHubListTool: Tool = {
  name: "document_hub_list",
  title: "List document hubs",
  description: "List local document hubs and their embedding, chunk, and document metadata.",
  inputSchema: { type: "object", properties: {} },
  annotations: readOnlyAnnotations,
};

export const documentHubInspectTool: Tool = {
  name: "document_hub_inspect",
  title: "Inspect document hub",
  description: "Inspect one local document hub and list its indexed document sources.",
  inputSchema: {
    type: "object",
    properties: { hubId: hubReferenceSchema },
    required: ["hubId"],
  },
  annotations: readOnlyAnnotations,
};

export const documentHubSearchTool: Tool = {
  name: "document_hub_search",
  title: "Search document hubs",
  description: "Search selected local document hubs using the same full-text, hybrid, and vector options as the Document Hub Search page.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Text to search for." },
      hubIds: { type: "array", items: hubReferenceSchema, description: "Optional hub ids or names. Defaults to all hubs." },
      mode: { type: "string", enum: ["fulltext", "hybrid", "vector"], default: "fulltext" },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      similarity: { type: "number", minimum: 0, maximum: 1, default: 0.4 },
    },
    required: ["query"],
  },
  annotations: readOnlyAnnotations,
};

export const documentHubSearchPluginDef = {
  name: "document-hub-search",
  title: "Document hub search",
  description: "Discover and search local document hubs.",
  match: (toolName: string) => [documentHubListTool.name, documentHubInspectTool.name, documentHubSearchTool.name].includes(toolName),
  tools: [documentHubListTool, documentHubInspectTool, documentHubSearchTool],
};

export function useDocumentHubSearchRuntime() {
  const hubs = useVectorStores();
  const { config } = useChatContext();
  const customHeaders = useAppStore((state) => state.customHeaders);
  const embed = useMemo(() => createVectorStoreEmbeddingClient(config, customHeaders), [config, customHeaders]);

  const handle = useCallback(async (toolCall: { toolName: string; input?: any }, signal?: AbortSignal): Promise<ToolTextResult> => {
    try {
      const input = toolCall.input ?? {};
      if (toolCall.toolName === documentHubListTool.name) {
        return ok({ hubs: await Promise.all(hubs.items.map(summarizeHub)) });
      }
      if (toolCall.toolName === documentHubInspectTool.name) {
        const hub = resolveHub(hubs.items, input.hubId);
        return ok({ hub: await summarizeHub(hub), documents: await listVectorStoreSources(hub) });
      }
      if (toolCall.toolName === documentHubSearchTool.name) {
        const query = String(input.query ?? "").trim();
        if (!query) throw new Error("A non-empty query is required.");
        const mode = (input.mode ?? "fulltext") as VectorStoreSearchMode;
        if (!["fulltext", "hybrid", "vector"].includes(mode)) throw new Error(`Unsupported search mode: ${mode}`);
        const limit = input.limit ?? 20;
        if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("limit must be an integer from 1 to 100.");
        const similarity = input.similarity ?? 0.4;
        if (mode !== "fulltext" && (!Number.isFinite(similarity) || similarity < 0 || similarity > 1)) {
          throw new Error("similarity must be between 0 and 1.");
        }
        const selected: VectorStore[] = Array.isArray(input.hubIds) && input.hubIds.length
          ? input.hubIds.map((reference: unknown) => resolveHub(hubs.items, reference))
          : hubs.items;
        const unique = Array.from(new Map<string, VectorStore>(selected.map((hub) => [hub.id, hub])).values());
        const searchable = unique.filter((hub) => getVectorStoreChunkCount(hub) > 0);
        const vectors = new Map<string, number[]>();
        if (mode !== "fulltext") {
          await Promise.all(Array.from(new Set(searchable.map((hub) => hub.model))).map(async (model) => {
            const [vector] = await embed(model, [query], signal);
            vectors.set(model, vector);
          }));
        }
        const byHub = await Promise.all(searchable.map(async (hub) => {
          const results = await searchVectorStoreByMode(hub, query, {
            mode,
            vector: vectors.get(hub.model),
            limit,
            similarity,
          });
          return results.map((result) => ({ ...result, hubId: hub.id, hubName: hub.name }));
        }));
        const results = byHub.flat().sort((left, right) => right.score - left.score).slice(0, limit);
        return ok({ query, mode, searchedHubIds: searchable.map((hub) => hub.id), results });
      }
      throw new Error(`Unsupported tool: ${toolCall.toolName}`);
    } catch (reason) {
      return fail(reason);
    }
  }, [embed, hubs.items]);

  return { name: documentHubSearchPluginDef.name, handle };
}

export const documentHubCreateTool: Tool = {
  name: "document_hub_editor_create",
  title: "Create document hub",
  description: "Create an empty local document hub using an embedding model.",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string" },
      description: { type: "string", default: "" },
      model: { type: "string", description: "Embedding model id." },
      chunkSize: { type: "integer", minimum: 1, default: 1000 },
      chunkOverlap: { type: "integer", minimum: 0, default: 200 },
    },
    required: ["name", "model"],
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
};

export const documentHubUpdateTool: Tool = {
  name: "document_hub_editor_update",
  title: "Update document hub",
  description: "Update a hub name, description, or chunk settings. The embedding model is immutable and chunk settings are locked after documents are added.",
  inputSchema: {
    type: "object",
    properties: {
      hubId: hubReferenceSchema,
      name: { type: "string" },
      description: { type: "string" },
      chunkSize: { type: "integer", minimum: 1 },
      chunkOverlap: { type: "integer", minimum: 0 },
    },
    required: ["hubId"],
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
};

export const documentHubDeleteTool: Tool = {
  name: "document_hub_editor_delete",
  title: "Delete document hub",
  description: "Permanently delete a local document hub and every indexed document in it.",
  inputSchema: { type: "object", properties: { hubId: hubReferenceSchema }, required: ["hubId"] },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
};

export const documentHubListDocumentsTool: Tool = {
  name: "document_hub_editor_list_documents",
  title: "List hub documents",
  description: "List indexed document sources in one local document hub.",
  inputSchema: { type: "object", properties: { hubId: hubReferenceSchema }, required: ["hubId"] },
  annotations: readOnlyAnnotations,
};

export const documentHubDeleteDocumentTool: Tool = {
  name: "document_hub_editor_delete_document",
  title: "Delete hub document",
  description: "Delete every indexed chunk whose source filename exactly matches the requested document.",
  inputSchema: {
    type: "object",
    properties: { hubId: hubReferenceSchema, filename: { type: "string" } },
    required: ["hubId", "filename"],
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
};

export const documentHubAddLocalFileTool: Tool = {
  name: "document_hub_editor_add_local_file",
  title: "Add stored local file to hub",
  description: "Read a file from browser local storage, convert supported PDF, Office, ebook, mail, Markdown, and text formats to text, then chunk, embed, and add it to a hub.",
  inputSchema: {
    type: "object",
    properties: {
      hubId: hubReferenceSchema,
      localFile: { type: "string", description: "Stored local file id or exact filename." },
      filename: { type: "string", description: "Optional source filename override in the hub." },
    },
    required: ["hubId", "localFile"],
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
};

export const documentHubAddResourceTool: Tool = {
  name: "document_hub_editor_add_mcp_resource",
  title: "Add MCP resource to hub",
  description: "Read all unique text pages of an MCP resource safely, then chunk, embed, and add the combined text to a local document hub.",
  inputSchema: {
    type: "object",
    properties: {
      hubId: hubReferenceSchema,
      serverUrl: { type: "string", description: "URL of a currently connected MCP server." },
      resourceUrl: { type: "string", description: "Absolute MCP resource URI." },
      filename: { type: "string", description: "Optional source filename; defaults to the resource URI." },
      pageLimit: { type: "integer", minimum: 1, maximum: 1000, default: 100 },
    },
    required: ["hubId", "serverUrl", "resourceUrl"],
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
};

export const documentHubEditorPluginDef = {
  name: "document-hub-editor",
  title: "Document hub editor",
  description: "Create and maintain local document hubs and their documents.",
  match: (toolName: string) => toolName.startsWith("document_hub_editor_"),
  tools: [
    documentHubCreateTool,
    documentHubUpdateTool,
    documentHubDeleteTool,
    documentHubListDocumentsTool,
    documentHubDeleteDocumentTool,
    documentHubAddLocalFileTool,
    documentHubAddResourceTool,
  ],
};

function resolveStoredFile(files: FilesContextType, reference: unknown) {
  const value = String(reference ?? "").trim();
  if (!value) throw new Error("A localFile id or filename is required.");
  const file = files.items.find((item) => item.id === value) ?? files.items.find((item) => item.name === value);
  if (!file) throw new Error(`Stored local file not found: ${value}`);
  return file;
}

function resolveMcpServerName(mcpServers: any, serverUrl: unknown) {
  const url = String(serverUrl ?? "").trim();
  if (!url) throw new Error("A serverUrl is required.");
  const entry = Object.entries(mcpServers ?? {}).find(([, value]: [string, any]) =>
    value?.config?.disabled !== true && value?.config?.url === url);
  if (!entry) throw new Error(`No enabled connected MCP server uses URL: ${url}`);
  return entry[0];
}

export function useDocumentHubEditorRuntime(files: FilesContextType, mcpServers: any) {
  const hubs = useVectorStores();
  const { config } = useChatContext();
  const customHeaders = useAppStore((state) => state.customHeaders);
  const embed = useMemo(() => createVectorStoreEmbeddingClient(config, customHeaders), [config, customHeaders]);

  const handle = useCallback(async (toolCall: { toolName: string; input?: any }, signal?: AbortSignal): Promise<ToolTextResult> => {
    try {
      const input = toolCall.input ?? {};
      if (toolCall.toolName === documentHubCreateTool.name) {
        const name = String(input.name ?? "").trim();
        const model = String(input.model ?? "").trim();
        if (!name) throw new Error("A non-empty hub name is required.");
        if (!model) throw new Error("An embedding model is required.");
        if (hubs.items.some((hub) => hub.name === name)) throw new Error(`A document hub named '${name}' already exists.`);
        const chunkSize = input.chunkSize ?? 1000;
        const chunkOverlap = input.chunkOverlap ?? 200;
        validateChunkSettings(chunkSize, chunkOverlap);
        const probe = [name, String(input.description ?? "").trim()].filter(Boolean).join("\n\n");
        const [vector] = await embed(model, [probe || name], signal);
        const hub = await hubs.add({ name, description: String(input.description ?? "").trim(), model, chunkSize, chunkOverlap, vectorSize: vector.length });
        return ok({ success: true, hub: await summarizeHub(hub) });
      }

      const hub = resolveHub(hubs.items, input.hubId);
      if (toolCall.toolName === documentHubUpdateTool.name) {
        const chunkSize = input.chunkSize ?? hub.chunkSize;
        const chunkOverlap = input.chunkOverlap ?? hub.chunkOverlap;
        validateChunkSettings(chunkSize, chunkOverlap);
        if ((chunkSize !== hub.chunkSize || chunkOverlap !== hub.chunkOverlap) && getVectorStoreChunkCount(hub) > 0) {
          throw new Error("Chunk settings cannot be changed after documents have been added.");
        }
        const name = input.name === undefined ? hub.name : String(input.name).trim();
        if (!name) throw new Error("A non-empty hub name is required.");
        if (hubs.items.some((item) => item.id !== hub.id && item.name === name)) throw new Error(`A document hub named '${name}' already exists.`);
        const updated = await hubs.update(hub.id, {
          name,
          description: input.description === undefined ? hub.description : String(input.description).trim(),
          chunkSize,
          chunkOverlap,
        });
        return ok({ success: true, hub: await summarizeHub(updated) });
      }
      if (toolCall.toolName === documentHubDeleteTool.name) {
        await hubs.delete(hub.id);
        return ok({ success: true, deletedHubId: hub.id, deletedHubName: hub.name });
      }
      if (toolCall.toolName === documentHubListDocumentsTool.name) {
        return ok({ hubId: hub.id, hubName: hub.name, documents: await listVectorStoreSources(hub) });
      }
      if (toolCall.toolName === documentHubDeleteDocumentTool.name) {
        const filename = String(input.filename ?? "").trim();
        if (!filename) throw new Error("A filename is required.");
        const existing = (await listVectorStoreSources(hub)).find((source) => source.filename === filename);
        if (!existing) throw new Error(`Document not found in hub: ${filename}`);
        const updated = await removeVectorStoreSource(hub, filename);
        await hubs.replace(updated);
        return ok({ success: true, hubId: hub.id, deletedDocument: existing });
      }
      if (toolCall.toolName === documentHubAddLocalFileTool.name) {
        const stored = resolveStoredFile(files, input.localFile);
        const browserFile = new File([stored.data], stored.name, { type: stored.data.type });
        const text = await extractTextFromFile(browserFile);
        if (!text?.trim()) throw new Error(`Stored file '${stored.name}' is not a supported text-convertible document.`);
        const filename = String(input.filename ?? stored.name).trim();
        const added = await addTextToHub(hub, filename, text, embed, signal);
        await hubs.replace(added.hub);
        return ok({ success: true, hubId: hub.id, filename, chunks: added.chunks, characters: added.characters, source: "local-file", localFileId: stored.id });
      }
      if (toolCall.toolName === documentHubAddResourceTool.name) {
        let parsedUri: URL;
        try { parsedUri = new URL(String(input.resourceUrl ?? "")); }
        catch { throw new Error("resourceUrl must be an absolute URI with a scheme."); }
        const serverName = resolveMcpServerName(mcpServers, input.serverUrl);
        const pageLimit = input.pageLimit ?? 100;
        if (!Number.isInteger(pageLimit) || pageLimit < 1 || pageLimit > 1000) throw new Error("pageLimit must be an integer from 1 to 1000.");
        const resource = await readAllResourceText({ serverName, uri: parsedUri.toString(), pageLimit });
        if (!resource.text) throw new Error("The MCP resource returned no unique textual content.");
        const filename = String(input.filename ?? parsedUri.toString()).trim();
        const added = await addTextToHub(hub, filename, resource.text, embed, signal);
        await hubs.replace(added.hub);
        return ok({
          success: true,
          hubId: hub.id,
          filename,
          chunks: added.chunks,
          characters: added.characters,
          source: "mcp-resource",
          resourceUrl: parsedUri.toString(),
          pagesRead: resource.pagesRead,
          uniqueTextItems: resource.textItems,
          paginationStopReason: resource.stopReason,
        });
      }
      throw new Error(`Unsupported tool: ${toolCall.toolName}`);
    } catch (reason) {
      return fail(reason);
    }
  }, [embed, files, hubs, mcpServers]);

  return { name: documentHubEditorPluginDef.name, handle };
}
