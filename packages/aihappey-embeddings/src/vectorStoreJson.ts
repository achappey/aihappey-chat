import type { VectorStore } from "./types";
import { hydrateVectorStoreDatabase } from "./oramaVectorStore";

export type VectorStoreJsonErrorCode = "invalid-json" | "invalid-shape" | "invalid-index";

export class VectorStoreJsonError extends Error {
  constructor(
    public readonly code: VectorStoreJsonErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "VectorStoreJsonError";
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isNonNegativeInteger = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= 0;

const safeFilenamePart = (value: string) => value
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
  .replace(/\s+/g, "-")
  .replace(/-+/g, "-")
  .replace(/^[-. ]+|[-. ]+$/g, "")
  .slice(0, 120);

/** Produces a filesystem-safe backup filename while keeping the JSON format explicit. */
export const vectorStoreJsonFilename = (hub: Pick<VectorStore, "id" | "name">) =>
  `${safeFilenamePart(hub.name) || safeFilenamePart(hub.id) || "document-hub"}.json`;

/** Serializes the persisted document-hub shape without introducing a wrapper format. */
export const serializeVectorStore = (hub: VectorStore) => JSON.stringify(
  hub,
  (_key, value) => ArrayBuffer.isView(value) ? Array.from(value as unknown as ArrayLike<number>) : value,
  2,
);

/** Validates both the persisted fields and the embedded Orama index before import. */
export const parseVectorStore = (text: string): VectorStore => {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (cause) {
    throw new VectorStoreJsonError("invalid-json", "The file does not contain valid JSON.", { cause });
  }

  if (
    !isRecord(value)
    || !isNonEmptyString(value.id)
    || !isNonEmptyString(value.name)
    || typeof value.description !== "string"
    || !isNonEmptyString(value.model)
    || !Number.isInteger(value.chunkSize)
    || Number(value.chunkSize) <= 0
    || !isNonNegativeInteger(value.chunkOverlap)
    || !isRecord(value.orama)
  ) {
    throw new VectorStoreJsonError("invalid-shape", "The JSON is not a valid document hub.");
  }

  const hub = value as unknown as VectorStore;
  try {
    hydrateVectorStoreDatabase(hub);
  } catch (cause) {
    throw new VectorStoreJsonError("invalid-index", "The document hub contains an invalid vector index.", { cause });
  }
  return hub;
};
