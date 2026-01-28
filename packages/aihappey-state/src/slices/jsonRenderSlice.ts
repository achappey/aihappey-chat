import type { StateCreator } from "zustand";

export type JsonRenderCanvasState = {
    requestId: number;
    prompt?: string;
    toolcallname?: string;
    activeData?: any;
    tree?: any;
    error?: string | null;
};

export type JsonRenderSlice = {
    activeData?: any
    defaultCatalogs?: string;
    defaultRegistries?: string;
    setActiveData: (activeData: any) => void;
    setDefaultCatalogs: (catalogs?: string) => void;
    setDefaultRegistries: (registries?: string) => void;
};

export const createJsonRenderSlice: StateCreator<
    any,
    [],
    [],
    JsonRenderSlice
> = (set, get) => ({
    setActiveData: (activeData) =>
        set((state: any) => ({
            activeData: activeData,
        })),
    setDefaultCatalogs: (catalogs) =>
        set(() => ({
            defaultCatalogs: catalogs,
        })),
    setDefaultRegistries: (registries) =>
        set(() => ({
            defaultRegistries: registries,
        })),
});
