import { get, set } from "idb-keyval";
import type { ResponseApiCreateRequest, ResponseApiResponse } from "aihappey-ai";
import type { JobItem, JobStore } from "../types";

const DB_KEY = "aihappey_jobs_v1";

async function load(): Promise<JobItem[]> {
  if (typeof window === "undefined") return [];
  try {
    return (await get(DB_KEY)) ?? [];
  } catch {
    return [];
  }
}

async function save(list: JobItem[]) {
  if (typeof window !== "undefined") {
    await set(DB_KEY, list);
  }
}

const getResponseId = (response: ResponseApiResponse) =>
  typeof response?.id === "string" ? response.id : undefined;

export class IndexedDBJobStore implements JobStore {
  readonly kind = "indexeddb" as const;

  private data: JobItem[] = [];
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

  add = async (
    request: ResponseApiCreateRequest,
    response: ResponseApiResponse,
    inputPreview = "",
  ): Promise<JobItem> => {
    await this.ensureLoaded();

    const now = new Date();
    const item: JobItem = {
      id: crypto.randomUUID(),
      responseId: getResponseId(response),
      createdAt: now,
      updatedAt: now,
      inputPreview,
      request,
      response,
    };

    this.data = [item, ...this.data];
    await this.commit();
    return item;
  };

  list = async (): Promise<JobItem[]> => {
    await this.ensureLoaded();
    return this.data;
  };

  update = async (id: string, response: ResponseApiResponse): Promise<JobItem> => {
    await this.ensureLoaded();

    const existing = this.data.find((x) => x.id === id);
    if (!existing) throw new Error(`Job '${id}' was not found`);

    const updated: JobItem = {
      ...existing,
      responseId: existing.responseId ?? getResponseId(response),
      updatedAt: new Date(),
      response,
    };

    this.data = this.data.map((x) => (x.id === id ? updated : x));
    await this.commit();
    return updated;
  };

  delete = async (id: string): Promise<void> => {
    await this.ensureLoaded();
    this.data = this.data.filter((x) => x.id !== id);
    await this.commit();
  };
}

