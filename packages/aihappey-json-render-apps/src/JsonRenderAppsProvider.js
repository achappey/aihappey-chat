import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, } from "react";
import { IndexedDBJsonRenderAppsStore } from "./stores/IndexedDBJsonRenderAppsStore";
const JsonRenderAppsContext = createContext(null);
export const indexedDbJsonRenderAppsStore = new IndexedDBJsonRenderAppsStore();
export const JsonRenderAppsProvider = ({ children, storageKind, }) => {
    const store = useMemo(() => {
        if (storageKind === "local")
            return indexedDbJsonRenderAppsStore;
        return indexedDbJsonRenderAppsStore;
    }, [storageKind]);
    const [items, setItems] = useState([]);
    const refresh = useCallback(() => {
        store.list().then(setItems);
    }, [store]);
    useEffect(() => {
        refresh();
    }, [store, refresh]);
    const ctxValue = useMemo(() => {
        const ctx = Object.assign(Object.create(Object.getPrototypeOf(store)), store, { items, refresh });
        ctx.create = async (item) => {
            const created = await store.create(item);
            setItems((prev) => [created, ...prev]);
            return created;
        };
        ctx.update = async (id, item) => {
            const updated = await store.update(id, item);
            setItems((prev) => prev.map((entry) => (entry.id === id ? updated : entry)));
            return updated;
        };
        ctx.delete = async (id) => {
            await store.delete(id);
            setItems((prev) => prev.filter((entry) => entry.id !== id));
        };
        return ctx;
    }, [store, items, refresh]);
    return (_jsx(JsonRenderAppsContext.Provider, { value: ctxValue, children: children }));
};
export const useJsonRenderApps = () => {
    const ctx = useContext(JsonRenderAppsContext);
    if (!ctx) {
        throw new Error("useJsonRenderApps must be used within JsonRenderAppsProvider");
    }
    return ctx;
};
//# sourceMappingURL=JsonRenderAppsProvider.js.map