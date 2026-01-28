import { get, set } from "idb-keyval";
const DB_KEY = "aihappey_json_render_apps_v1";
async function load() {
    if (typeof window === "undefined")
        return [];
    try {
        return (await get(DB_KEY)) ?? [];
    }
    catch {
        return [];
    }
}
async function save(list) {
    if (typeof window !== "undefined") {
        await set(DB_KEY, list);
    }
}
export class IndexedDBJsonRenderAppsStore {
    kind = "indexeddb";
    data = [];
    loaded = false;
    async ensureLoaded() {
        if (!this.loaded) {
            this.data = await load();
            this.loaded = true;
        }
    }
    async commit() {
        await save(this.data);
    }
    list = async () => {
        await this.ensureLoaded();
        return this.data;
    };
    read = async (id) => {
        await this.ensureLoaded();
        return this.data.find((item) => item.id === id);
    };
    create = async (item) => {
        await this.ensureLoaded();
        const now = new Date().toISOString();
        const created = {
            ...item,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        };
        this.data = [created, ...this.data];
        await this.commit();
        return created;
    };
    update = async (id, item) => {
        await this.ensureLoaded();
        const index = this.data.findIndex((entry) => entry.id === id);
        if (index < 0)
            throw new Error("App not found.");
        const createdAt = this.data[index]?.createdAt;
        const updated = {
            ...item,
            id,
            createdAt,
            updatedAt: new Date().toISOString(),
        };
        this.data = [updated, ...this.data.filter((entry) => entry.id !== id)];
        await this.commit();
        return updated;
    };
    delete = async (id) => {
        await this.ensureLoaded();
        this.data = this.data.filter((entry) => entry.id !== id);
        await this.commit();
    };
}
//# sourceMappingURL=IndexedDBJsonRenderAppsStore.js.map