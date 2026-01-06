import type { FileItem, FileStore, StoredFile } from "./types";

export const KNOWN_SPEAKER_REFERENCE_PREFIX = "known_speaker_reference_";

/**
 * Keep mapping stable and human readable.
 * We still sanitize to avoid problematic characters in an IndexedDB "name".
 */
export function sanitizeKnownSpeakerName(name: string): string {
  return (name ?? "")
    .trim()
    // collapse whitespace
    .replace(/\s+/g, " ")
    // avoid path-like characters
    .replace(/[\\/]/g, "-")
    // avoid characters that are often reserved in filenames
    .replace(/[<>:"|?*]/g, "");
}

export async function resolveKnownSpeakerReferenceDataUrls(
  items: FileItem[],
  speakerNames: string[],
  read: (id: string) => Promise<StoredFile>
): Promise<string[] | undefined> {
  if (!speakerNames.length) return undefined;

  const latestItems = speakerNames.map((n) =>
    getLatestKnownSpeakerReferenceItem(items, n)
  );

  if (latestItems.some((i) => !i)) return undefined;

  return Promise.all(
    latestItems.map(async (item) => {
      const stored = await read(item!.id);
      return blobToDataUrl(stored.data); // ✅ data:audio/...;base64
    })
  );
}



export function knownSpeakerReferenceNamePrefix(speakerName: string): string {
  const safe = sanitizeKnownSpeakerName(speakerName);
  // Required naming convention: known_speaker_reference_[NAME]
  return `${KNOWN_SPEAKER_REFERENCE_PREFIX}[${safe}]`;
}

export function extFromFilename(filename: string): string | undefined {
  const i = filename.lastIndexOf(".");
  if (i <= 0 || i === filename.length - 1) return undefined;
  return filename.substring(i + 1).toLowerCase();
}

export function knownSpeakerReferenceFilename(
  speakerName: string,
  ext?: string
): string {
  const base = knownSpeakerReferenceNamePrefix(speakerName);
  const safeExt = (ext ?? "").replace(/^\./, "").trim();
  return safeExt ? `${base}.${safeExt}` : base;
}

export function listKnownSpeakerReferenceItems(
  items: FileItem[],
  speakerName: string
): FileItem[] {
  const prefix = knownSpeakerReferenceNamePrefix(speakerName);
  return items.filter((i) => i.name.startsWith(prefix));
}

export function getLatestKnownSpeakerReferenceItem(
  items: FileItem[],
  speakerName: string
): FileItem | undefined {
  const matches = listKnownSpeakerReferenceItems(items, speakerName);
  matches.sort((a, b) => b.createdAt - a.createdAt);
  return matches[0];
}

export async function readStoredFileOrThrow(
  store: FileStore,
  id: string
): Promise<StoredFile> {
  const f = await store.read(id);
  if (!f) throw new Error(`File not found (${id})`);
  return f;
}

export async function deleteKnownSpeakerReferenceSamples(
  store: FileStore & { items?: FileItem[] },
  speakerName: string
): Promise<void> {
  const items = store.items ?? (await store.list());
  const matches = listKnownSpeakerReferenceItems(items, speakerName);
  await Promise.all(matches.map((m) => store.delete(m.id)));
}

/**
 * Save/replace: delete all previous samples for that speaker, then create a new one.
 */
export async function saveKnownSpeakerReferenceSample(
  store: FileStore & { items?: FileItem[] },
  speakerName: string,
  file: File
): Promise<FileItem> {
  const ext = extFromFilename(file.name) ?? "webm";
  const name = knownSpeakerReferenceFilename(speakerName, ext);

  await deleteKnownSpeakerReferenceSamples(store, speakerName);
  return await store.create({
    name,
    mimeType: file.type || "application/octet-stream",
    data: file,
  });
}

/**
 * Move latest sample from old speaker name to new speaker name.
 * (Files store has no rename; we copy blob -> create new -> delete old files.)
 */
export async function migrateKnownSpeakerReferenceSample(
  store: FileStore & { items?: FileItem[] },
  fromSpeakerName: string,
  toSpeakerName: string
): Promise<void> {
  const items = store.items ?? (await store.list());
  const latest = getLatestKnownSpeakerReferenceItem(items, fromSpeakerName);
  if (!latest) return;

  const stored = await readStoredFileOrThrow(store, latest.id);
  const fromExt = extFromFilename(latest.name) ?? "webm";
  const toName = knownSpeakerReferenceFilename(toSpeakerName, fromExt);

  // Create new first, then delete old to avoid losing the sample on transient errors.
  await store.create({
    name: toName,
    mimeType: stored.data.type || "application/octet-stream",
    data: stored.data,
  });

  await deleteKnownSpeakerReferenceSamples(store, fromSpeakerName);
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error ?? new Error("Failed to read blob"));
    r.readAsDataURL(blob);
  });
}

