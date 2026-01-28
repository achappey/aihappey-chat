import { get, set } from "idb-keyval";
import type {
  JsonRenderActionItem,
  JsonRenderRegistryItem,
  JsonRenderRegistryStore,
} from "../types";

const DB_KEY = "aihappey_json_render_registry_v1";
const ACTIONS_DB_KEY = "aihappey_json_render_registry_actions_v1";

async function load(): Promise<JsonRenderRegistryItem[]> {
  if (typeof window === "undefined") return [];
  try {
    return (await get(DB_KEY)) ?? [];
  } catch {
    return [];
  }
}

async function loadActions(): Promise<JsonRenderActionItem[]> {
  if (typeof window === "undefined") return [];
  try {
    return (await get(ACTIONS_DB_KEY)) ?? [];
  } catch {
    return [];
  }
}

async function save(list: JsonRenderRegistryItem[]) {
  if (typeof window !== "undefined") {
    await set(DB_KEY, list);
  }
}

async function saveActions(list: JsonRenderActionItem[]) {
  if (typeof window !== "undefined") {
    await set(ACTIONS_DB_KEY, list);
  }
}

export class IndexedDBJsonRenderRegistryStore implements JsonRenderRegistryStore {
  readonly kind = "indexeddb" as const;

  private data: JsonRenderRegistryItem[] = [];
  private actionData: JsonRenderActionItem[] = [];
  private loaded = false;
  private actionsLoaded = false;

  private async ensureLoaded() {
    if (!this.loaded) {
      this.data = await load();
      this.loaded = true;
    }
  }

  private async ensureActionsLoaded() {
    if (!this.actionsLoaded) {
      this.actionData = await loadActions();
      this.actionsLoaded = true;
    }
  }

  private async commit() {
    await save(this.data);
  }

  private async commitActions() {
    await saveActions(this.actionData);
  }

  add = async (
    registryId: string,
    name: string,
    code: string,
    propsSchema?: string,
  ): Promise<JsonRenderRegistryItem> => {
    await this.ensureLoaded();

    const now = new Date().toISOString();
    const item: JsonRenderRegistryItem = {
      id: crypto.randomUUID(),
      registryId,
      name,
      code,
      propsSchema,
      createdAt: now,
      updatedAt: now,
    };

    this.data = [item, ...this.data];
    await this.commit();
    return item;
  };

  update = async (
    id: string,
    registryId: string,
    name: string,
    code: string,
    propsSchema?: string,
  ): Promise<JsonRenderRegistryItem> => {
    await this.ensureLoaded();

    const index = this.data.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("Registry component not found.");

    const createdAt = this.data[index]?.createdAt;
    const updated: JsonRenderRegistryItem = {
      id,
      registryId,
      name,
      code,
      propsSchema,
      createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.data = [updated, ...this.data.filter((item) => item.id !== id)];
    await this.commit();
    return updated;
  };

  list = async (): Promise<JsonRenderRegistryItem[]> => {
    await this.ensureLoaded();
    return this.data;
  };

  delete = async (id: string): Promise<void> => {
    await this.ensureLoaded();
    this.data = this.data.filter((x) => x.id !== id);
    await this.commit();
  };

  addAction = async (
    registryId: string,
    name: string,
    code: string,
    paramsSchema?: string,
    description?: string,
    title?: string,
  ): Promise<JsonRenderActionItem> => {
    await this.ensureActionsLoaded();

    const now = new Date().toISOString();
    const item: JsonRenderActionItem = {
      id: crypto.randomUUID(),
      registryId,
      name,
      code,
      paramsSchema,
      description,
      title,
      createdAt: now,
      updatedAt: now,
    };

    this.actionData = [item, ...this.actionData];
    await this.commitActions();
    return item;
  };

  updateAction = async (
    id: string,
    registryId: string,
    name: string,
    code: string,
    paramsSchema?: string,
    description?: string,
    title?: string,
  ): Promise<JsonRenderActionItem> => {
    await this.ensureActionsLoaded();

    const index = this.actionData.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("Registry action not found.");

    const createdAt = this.actionData[index]?.createdAt;
    const updated: JsonRenderActionItem = {
      id,
      registryId,
      name,
      code,
      paramsSchema,
      description,
      title,
      createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.actionData = [updated, ...this.actionData.filter((item) => item.id !== id)];
    await this.commitActions();
    return updated;
  };

  listActions = async (): Promise<JsonRenderActionItem[]> => {
    await this.ensureActionsLoaded();
    return this.actionData;
  };

  deleteAction = async (id: string): Promise<void> => {
    await this.ensureActionsLoaded();
    this.actionData = this.actionData.filter((x) => x.id !== id);
    await this.commitActions();
  };
}
