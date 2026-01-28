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
    setActiveData: (activeData: any) => void;
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
});
