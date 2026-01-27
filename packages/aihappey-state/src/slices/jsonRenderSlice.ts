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
    jsonRenderByConversation: Record<string, JsonRenderCanvasState>;
    activeData?: any
    setJsonRenderRequest: (
        conversationId: string,
        payload: { prompt: string; toolcallname: string; activeData: any }
    ) => void;
    setJsonRenderTree: (conversationId: string, tree: any | null) => void;
    setJsonRenderError: (conversationId: string, error: string | null) => void;
    clearJsonRender: (conversationId: string) => void;
    setActiveData: (activeData: any) => void;
};

export const createJsonRenderSlice: StateCreator<
    any,
    [],
    [],
    JsonRenderSlice
> = (set, get) => ({
    jsonRenderByConversation: {},
    setActiveData: (activeData) =>
        set((state: any) => ({
            activeData: activeData,
        })),
    setJsonRenderRequest: (conversationId, payload) =>
        set((state: any) => {
            const prev = state.jsonRenderByConversation?.[conversationId] ?? {
                requestId: 0,
            };

            return {
                jsonRenderByConversation: {
                    ...(state.jsonRenderByConversation ?? {}),
                    [conversationId]: {
                        ...prev,
                        ...payload,
                        requestId: (prev.requestId ?? 0) + 1,
                    },
                },
            };
        }),
    setJsonRenderTree: (conversationId, tree) =>
        set((state: any) => ({
            jsonRenderByConversation: {
                ...(state.jsonRenderByConversation ?? {}),
                [conversationId]: {
                    ...(state.jsonRenderByConversation?.[conversationId] ?? { requestId: 0 }),
                    tree,
                },
            },
        })),
    setJsonRenderError: (conversationId, error) =>
        set((state: any) => ({
            jsonRenderByConversation: {
                ...(state.jsonRenderByConversation ?? {}),
                [conversationId]: {
                    ...(state.jsonRenderByConversation?.[conversationId] ?? { requestId: 0 }),
                    error,
                },
            },
        })),
    clearJsonRender: (conversationId) =>
        set((state: any) => {
            const { [conversationId]: _, ...rest } = state.jsonRenderByConversation ?? {};
            return { jsonRenderByConversation: rest };
        }),
});
