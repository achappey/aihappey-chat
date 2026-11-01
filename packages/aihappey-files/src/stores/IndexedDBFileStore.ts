import { get, set } from "idb-keyval";
import { FileItem, FileStore, StoredFile } from "../types";

const DB_KEY = "aihappey_files_v1";

type InternalFile = StoredFile;

async function load(): Promise<InternalFile[]> {
  if (typeof window === "undefined") return [];
  // A failed read is not an empty workspace: never allow a subsequent mutation
  // to overwrite existing files merely because loading IndexedDB failed.
  return (await get(DB_KEY)) ?? [];
}

async function save(list: InternalFile[]) {
  if (typeof window !== "undefined") {
    await set(DB_KEY, list);
  }
}

export class IndexedDBFileStore implements FileStore {
  readonly kind = "indexeddb" as const;

  private data: InternalFile[] = [];
  private loading?: Promise<void>;
  private mutations: Promise<unknown> = Promise.resolve();

  private async ensureLoaded() {
    await (this.loading ??= load().then(data => { this.data = data; }));
  }

  private mutate<T>(change: (data: InternalFile[]) => { data: InternalFile[]; value: T }): Promise<T> {
    const run = async () => {
      await this.ensureLoaded();
      const next = change(this.data);
      // Publish in-memory state only after the single IndexedDB write succeeds.
      await save(next.data);
      this.data = next.data;
      return next.value;
    };
    const result = this.mutations.then(run, run);
    this.mutations = result.catch(() => undefined);
    return result;
  }

  list = async (): Promise<StoredFile[]> => {
    await this.ensureLoaded();
    await this.mutations;
    return [...this.data];
  };

  read = async (id: string): Promise<StoredFile | undefined> => {
    await this.ensureLoaded();
    await this.mutations;
    return this.data.find((f) => f.id === id);
  };

  create = async (file: {
    name: string;
    mimeType: string;
    data: Blob;
  }): Promise<StoredFile> => {
    await this.ensureLoaded();

    // Single source of truth: blob carries the MIME type + size.
    // If incoming blob has an empty type, create a typed clone using the provided mimeType.
    const normalizedData =
      file.data?.type || !file.mimeType
        ? file.data
        : new Blob([file.data], { type: file.mimeType });

    const item: InternalFile = {
      id: crypto.randomUUID(),
      name: file.name,
      createdAt: Date.now(),
      data: normalizedData,
    };

    return this.mutate(data => ({ data: [item, ...data], value: item }));
  };

  rename = async (id: string, newName: string): Promise<StoredFile> => {
    await this.ensureLoaded();

    const normalizedNewName = String(newName ?? "").trim();
    if (!normalizedNewName) throw new Error("File name is required.");

    return this.mutate(data => {
      const current = data.find(f => f.id === id);
      if (!current) throw new Error("File not found.");
      const updated = { ...current, name: normalizedNewName };
      return { data: data.map(f => f.id === id ? updated : f), value: updated };
    });
  };

  replace = (id: string, blob: Blob, expectedData?: Blob): Promise<StoredFile> => this.mutate(data => {
    const current = data.find(f => f.id === id);
    if (!current) throw new Error("File not found.");
    if (expectedData && current.data !== expectedData) throw new Error("File changed while applying patch. Read it again.");
    const updated = { ...current, data: blob };
    return { data: data.map(f => f.id === id ? updated : f), value: updated };
  });

  delete = (id: string, expectedData?: Blob): Promise<void> => this.mutate(data => {
    const current = data.find(f => f.id === id);
    if (expectedData && current?.data !== expectedData) throw new Error("File changed while applying patch. Read it again.");
    return { data: data.filter(f => f.id !== id), value: undefined };
  });
}
