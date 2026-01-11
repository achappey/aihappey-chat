import { get, set } from "idb-keyval";
import { FileItem, FileStore, StoredFile } from "../types";

const DB_KEY = "aihappey_files_v1";

type InternalFile = StoredFile;

async function load(): Promise<InternalFile[]> {
  if (typeof window === "undefined") return [];
  try {
    return (await get(DB_KEY)) ?? [];
  } catch {
    return [];
  }
}

async function save(list: InternalFile[]) {
  if (typeof window !== "undefined") {
    await set(DB_KEY, list);
  }
}

export class IndexedDBFileStore implements FileStore {
  readonly kind = "indexeddb" as const;

  private data: InternalFile[] = [];
  private loaded = false;

  private async ensureLoaded() {
    if (!this.loaded) {
      this.data = await load();
      this.loaded = true;
    }
  }

  private async commit() {
    await save(this.data);
  }

  list = async (): Promise<StoredFile[]> => {
    await this.ensureLoaded();
    return this.data//.map(({ data, ...meta }) => meta);
  };

  read = async (id: string): Promise<StoredFile | undefined> => {
    await this.ensureLoaded();
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

    this.data = [item, ...this.data];
    await this.commit();

    return item;
  };

  delete = async (id: string): Promise<void> => {
    await this.ensureLoaded();
    this.data = this.data.filter((f) => f.id !== id);
    await this.commit();
  };
}
