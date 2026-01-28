import type { ReactNode } from "react";
import type { JsonRenderAppItem, JsonRenderAppsStore, JsonRenderAppStorageKind } from "./types";
import { IndexedDBJsonRenderAppsStore } from "./stores/IndexedDBJsonRenderAppsStore";
export type JsonRenderAppsContextType = JsonRenderAppsStore & {
    items: JsonRenderAppItem[];
    refresh: () => void;
};
export declare const indexedDbJsonRenderAppsStore: IndexedDBJsonRenderAppsStore;
export declare const JsonRenderAppsProvider: ({ children, storageKind, }: {
    children: ReactNode;
    storageKind?: JsonRenderAppStorageKind;
}) => import("react/jsx-runtime").JSX.Element;
export declare const useJsonRenderApps: () => JsonRenderAppsContextType;
//# sourceMappingURL=JsonRenderAppsProvider.d.ts.map