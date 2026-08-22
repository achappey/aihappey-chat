export const validateChunkSettings = (chunkSize: number, chunkOverlap: number) => {
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new Error("Chunk size must be a positive integer.");
  }
  if (!Number.isInteger(chunkOverlap) || chunkOverlap < 0 || chunkOverlap >= chunkSize) {
    throw new Error("Chunk overlap must be an integer between 0 and chunk size - 1.");
  }
};

/** Splits text by character count and prefers a nearby whitespace boundary. */
export const chunkText = (text: string, chunkSize: number, chunkOverlap: number): string[] => {
  validateChunkSettings(chunkSize, chunkOverlap);
  const value = String(text ?? "").trim();
  if (!value) return [];

  const chunks: string[] = [];
  let start = 0;
  while (start < value.length) {
    let end = Math.min(start + chunkSize, value.length);
    if (end < value.length) {
      const floor = start + Math.floor(chunkSize * 0.6);
      const whitespace = value.lastIndexOf(" ", end);
      if (whitespace >= floor) end = whitespace;
    }

    const chunk = value.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= value.length) break;

    const nextStart = end - chunkOverlap;
    start = nextStart > start ? nextStart : end;
    while (start < value.length && /\s/.test(value[start])) start += 1;
  }
  return chunks;
};
