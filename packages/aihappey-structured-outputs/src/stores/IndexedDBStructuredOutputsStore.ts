import { get, set } from "idb-keyval";
import { StructuredOutputsItem, StructuredOutputsStore } from "../types";

const DB_KEY = "aihappey_structured_outputs_v1";

async function load(): Promise<StructuredOutputsItem[]> {
  if (typeof window === "undefined") return [];
  try {
    return (await get(DB_KEY)) ?? [];
  } catch {
    return [];
  }
}

async function save(list: StructuredOutputsItem[]) {
  if (typeof window !== "undefined") {
    await set(DB_KEY, list);
  }
}

export class IndexedDBStructuredOutputsStore implements StructuredOutputsStore {
  readonly kind = "indexeddb" as const;

  private data: StructuredOutputsItem[] = [];
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
    name: string,
    schema: string,
  ): Promise<StructuredOutputsItem> => {
    await this.ensureLoaded();

    const item: StructuredOutputsItem = {
      id: crypto.randomUUID(),
      name,
      json_schema: schema,
    };

    this.data = [item, ...this.data];
    await this.commit();
    return item;
  };

  update = async (
    id: string,
    name: string,
    schema: string,
  ): Promise<StructuredOutputsItem> => {
    await this.ensureLoaded();

    const index = this.data.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("Structured output schema not found.");

    const updated: StructuredOutputsItem = {
      id,
      name,
      json_schema: schema,
    };

    this.data = [updated, ...this.data.filter((item) => item.id !== id)];
    await this.commit();
    return updated;
  };

  list = async (): Promise<StructuredOutputsItem[]> => {
    await this.ensureLoaded();
    return this.data;
  };

  delete = async (id: string): Promise<void> => {
    await this.ensureLoaded();
    this.data = this.data.filter((x) => x.id !== id);
    await this.commit();
  };
}
