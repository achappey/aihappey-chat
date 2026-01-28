export type JsonRenderAppStorageKind = "indexeddb" | "local";
export type JsonRenderAppItem = {
    id: string;
    name: string;
    uiTree: any;
    data?: any;
    registryIds?: string[];
    createdAt?: string;
    updatedAt?: string;
};
export interface JsonRenderAppsStore {
    readonly kind: JsonRenderAppStorageKind;
    list(): Promise<JsonRenderAppItem[]>;
    read(id: string): Promise<JsonRenderAppItem | undefined>;
    create(item: Omit<JsonRenderAppItem, "id" | "createdAt" | "updatedAt">): Promise<JsonRenderAppItem>;
    update(id: string, item: Omit<JsonRenderAppItem, "id" | "createdAt" | "updatedAt">): Promise<JsonRenderAppItem>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=types.d.ts.map