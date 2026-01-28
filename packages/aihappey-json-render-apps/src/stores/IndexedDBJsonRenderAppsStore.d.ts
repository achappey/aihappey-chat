import type { JsonRenderAppItem, JsonRenderAppsStore } from "../types";
export declare class IndexedDBJsonRenderAppsStore implements JsonRenderAppsStore {
    readonly kind: "indexeddb";
    private data;
    private loaded;
    private ensureLoaded;
    private commit;
    list: () => Promise<JsonRenderAppItem[]>;
    read: (id: string) => Promise<JsonRenderAppItem | undefined>;
    create: (item: Omit<JsonRenderAppItem, "id" | "createdAt" | "updatedAt">) => Promise<JsonRenderAppItem>;
    update: (id: string, item: Omit<JsonRenderAppItem, "id" | "createdAt" | "updatedAt">) => Promise<JsonRenderAppItem>;
    delete: (id: string) => Promise<void>;
}
//# sourceMappingURL=IndexedDBJsonRenderAppsStore.d.ts.map