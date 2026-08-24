import {
  count,
  create,
  insertMultiple,
  load,
  removeMultiple,
  save,
  search,
} from "@orama/orama";
import type { AnyOrama } from "@orama/orama";
import type {
  VectorStore,
  VectorStoreSearchResult,
  VectorStoreSource,
  VectorStoreChunk,
  VectorStoreModeSearchOptions,
} from "./types";

type ChunkDocument = VectorStoreChunk;

const getVectorSizeFromRawData = (hub: VectorStore): number => {
  const size = Number((hub.orama as any)?.index?.vectorIndexes?.embedding?.size);
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error(`Document hub '${hub.name}' has an invalid vector index.`);
  }
  return size;
};

export const createVectorStoreDatabase = (vectorSize: number): AnyOrama => {
  if (!Number.isInteger(vectorSize) || vectorSize <= 0) {
    throw new Error("Embedding vector size must be a positive integer.");
  }
  return create({
    schema: {
      filename: "string",
      content: "string",
      embedding: `vector[${vectorSize}]` as `vector[${number}]`,
    },
  });
};

export const hydrateVectorStoreDatabase = (hub: VectorStore): AnyOrama => {
  const db = createVectorStoreDatabase(getVectorSizeFromRawData(hub));
  load(db, hub.orama);
  return db;
};

export const getVectorStoreVectorSize = getVectorSizeFromRawData;

export const getVectorStoreChunkCount = (hub: VectorStore) => count(hydrateVectorStoreDatabase(hub));

export const listVectorStoreSources = async (hub: VectorStore): Promise<VectorStoreSource[]> => {
  const db = hydrateVectorStoreDatabase(hub);
  const result = await search<ReturnType<typeof hydrateVectorStoreDatabase>, ChunkDocument>(db, {
    term: "",
    limit: Math.max(1, count(db)),
    includeVectors: false,
  } as any);
  const grouped = new Map<string, VectorStoreSource>();
  for (const hit of result.hits) {
    const existing = grouped.get(hit.document.filename) ?? {
      filename: hit.document.filename,
      chunks: 0,
      characters: 0,
    };
    existing.chunks += 1;
    existing.characters += hit.document.content.length;
    grouped.set(existing.filename, existing);
  }
  return Array.from(grouped.values()).sort((a, b) => a.filename.localeCompare(b.filename));
};

export const insertVectorStoreChunks = async (
  hub: VectorStore,
  chunks: VectorStoreChunk[],
): Promise<VectorStore> => {
  const vectorSize = getVectorSizeFromRawData(hub);
  if (!chunks.length) return hub;
  for (const chunk of chunks) {
    if (!chunk.filename.trim() || !chunk.content.trim()) throw new Error("Document chunks require a filename and content.");
    if (chunk.embedding.length !== vectorSize) {
      throw new Error(`Embedding dimension mismatch: expected ${vectorSize}, received ${chunk.embedding.length}.`);
    }
  }
  const db = hydrateVectorStoreDatabase(hub);
  await insertMultiple(db, chunks);
  return { ...hub, orama: save(db) };
};

export const removeVectorStoreSource = async (hub: VectorStore, filename: string): Promise<VectorStore> => {
  const db = hydrateVectorStoreDatabase(hub);
  const result = await search<ReturnType<typeof hydrateVectorStoreDatabase>, ChunkDocument>(db, {
    term: "",
    limit: Math.max(1, count(db)),
    includeVectors: false,
  } as any);
  const ids = result.hits.filter((hit) => hit.document.filename === filename).map((hit) => hit.id);
  if (ids.length) await removeMultiple(db, ids);
  return { ...hub, orama: save(db) };
};

export const searchVectorStore = async (
  hub: VectorStore,
  vector: number[],
  options?: { limit?: number; similarity?: number },
): Promise<VectorStoreSearchResult[]> => {
  const vectorSize = getVectorSizeFromRawData(hub);
  if (vector.length !== vectorSize) {
    throw new Error(`Embedding dimension mismatch: expected ${vectorSize}, received ${vector.length}.`);
  }
  const db = hydrateVectorStoreDatabase(hub);
  const result = await search<ReturnType<typeof hydrateVectorStoreDatabase>, ChunkDocument>(db, {
    mode: "vector",
    vector: { value: vector, property: "embedding" },
    similarity: options?.similarity ?? 0.7,
    limit: options?.limit ?? 20,
    includeVectors: false,
  } as any);
  return result.hits.map((hit) => ({
    id: hit.id,
    filename: hit.document.filename,
    content: hit.document.content,
    score: hit.score,
  }));
};

/**
 * Searches a document hub using any Orama search mode.
 *
 * This is intentionally separate from searchVectorStore so the original
 * vector-only public API remains backward compatible.
 */
export const searchVectorStoreByMode = async (
  hub: VectorStore,
  query: string,
  options: VectorStoreModeSearchOptions,
): Promise<VectorStoreSearchResult[]> => {
  const term = query.trim();
  const limit = options.limit ?? 20;
  const db = hydrateVectorStoreDatabase(hub);
  let params: Record<string, unknown>;

  if (options.mode === "fulltext") {
    params = {
      mode: "fulltext",
      term,
      properties: ["filename", "content"],
      limit,
      includeVectors: false,
    };
  } else {
    const vector = options.vector;
    if (!vector) {
      throw new Error(`A query embedding is required for ${options.mode} search.`);
    }
    const vectorSize = getVectorSizeFromRawData(hub);
    if (vector.length !== vectorSize) {
      throw new Error(`Embedding dimension mismatch: expected ${vectorSize}, received ${vector.length}.`);
    }

    params = {
      mode: options.mode,
      ...(options.mode === "hybrid"
        ? { term, properties: ["filename", "content"] }
        : {}),
      vector: { value: vector, property: "embedding" },
      similarity: options.similarity ?? 0.7,
      limit,
      includeVectors: false,
    };
  }

  const result = await search<ReturnType<typeof hydrateVectorStoreDatabase>, ChunkDocument>(db, params as any);
  return result.hits.map((hit) => ({
    id: hit.id,
    filename: hit.document.filename,
    content: hit.document.content,
    score: hit.score,
  }));
};
