"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Spec, UIElement, FlatElement } from "@json-render/core";
import { createSpecStreamCompiler } from "@json-render/core";

/**
 * Options for useUIStream
 */
export interface UseUIStreamOptions {
    /** API endpoint */
    api: string;
    /** Prompt describing the catalog/components available */
    catalogPrompt?: string;
    /** Model identifier */
    model?: string;
    /** Auth helper to fetch access token */
    getAccessToken?: () => Promise<string>;
    /** Custom headers to include */
    customHeaders?: Record<string, string>;
    /** Optional initial UI spec to seed patch application */
    initialTree?: Spec | null;
    /** Callback when complete */
    onComplete?: (spec: Spec) => void;
    /** Callback on error */
    onError?: (error: Error) => void;
}

/**
 * Return type for useUIStream
 */
export interface UseUIStreamReturn {
    /** Current UI spec */
    spec: Spec | null;
    /** Whether currently streaming */
    isStreaming: boolean;
    /** Error if any */
    error: Error | null;
    /** Send a prompt to generate UI */
    send: (
        prompt: string,
        context?: Record<string, unknown>,
        providerMetadata?: any,
        baseTree?: Spec | null,
        maxOutputTokens?: number | null,
        catalogPromptOverride?: string,
    ) => Promise<any>;
    /** Clear the current spec */
    clear: () => void;
}



export async function makeHeaders(getAccessToken: any, customHeaders?: any) {
    const tokenHeaders = getAccessToken
        ? { "Authorization": "Bearer " + await getAccessToken() }  // must return an object like { Authorization: "Bearer ..." }
        : {};

    return {
        "Content-Type": "application/json",
        ...(customHeaders ?? {}),
        ...tokenHeaders

    };
}

/**
 * Hook for streaming UI generation
 */
export function useUIStream({
    api,
    catalogPrompt,
    model,
    getAccessToken,
    customHeaders,
    initialTree,
    onComplete,
    onError,
}: UseUIStreamOptions): UseUIStreamReturn {
    const [spec, setSpec] = useState<Spec | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const specRef = useRef<Spec | null>(null);
    const hasSeededRef = useRef(false);

    useEffect(() => {
        specRef.current = spec;
    }, [spec]);

    useEffect(() => {
        if (!initialTree || isStreaming || hasSeededRef.current) return;
        hasSeededRef.current = true;
        specRef.current = initialTree;
        setSpec(initialTree);
    }, [initialTree, isStreaming]);

    const clear = useCallback(() => {
        setSpec(null);
        setError(null);
    }, []);


    const send = useCallback(
        async (
            prompt: string,
            context?: Record<string, unknown>,
            providerMetadata?: any,
            baseTree?: Spec | null,
            maxOutputTokens?: number | null,
            catalogPromptOverride?: string,
        ) => {
            // Abort any existing request
            abortControllerRef.current?.abort();
            const abortController = new AbortController();
            abortControllerRef.current = abortController;

            setIsStreaming(true);
            setError(null);
            let currentSpec: Spec =
                baseTree ?? specRef.current ?? initialTree ?? { root: "", elements: {} };
            // Keep request-owned state local. A later send may replace the active
            // request while this one is unwinding after being aborted.
            const compiler = createSpecStreamCompiler<Spec>(currentSpec);
            if (baseTree || (!specRef.current && initialTree)) {
                specRef.current = currentSpec;
                setSpec(currentSpec);
            }
            // if (spec == null)
            //  setSpec(currentSpec);

            const headers: any = await makeHeaders(getAccessToken, customHeaders);
            try {
                const response = await fetch(api, {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify({
                        prompt,
                        model,
                        context,
                        catalogPrompt: catalogPromptOverride ?? catalogPrompt,
                        maxOutputTokens,
                        providerMetadata
                    }),
                    signal: abortController.signal,
                });

                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }

                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error("No response body");
                }

                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    if (!chunk) continue;
                    const { result, newPatches } = compiler.push(chunk);
                    if (newPatches.length > 0) {
                        currentSpec = result;
                        specRef.current = result;
                        setSpec({ ...result });
                    }
                }

                const finalResult = compiler.getResult();
                currentSpec = finalResult;
                specRef.current = finalResult;
                setSpec({ ...finalResult });

                onComplete?.(currentSpec);

                return currentSpec;
            } catch (err) {
                if ((err as Error).name === "AbortError") {
                    return;
                }
                const error = err instanceof Error ? err : new Error(String(err));
                setError(error);
                onError?.(error);
            } finally {
                // An older aborted request must not mark a newer request idle.
                if (abortControllerRef.current === abortController) {
                    abortControllerRef.current = null;
                    setIsStreaming(false);
                }
            }
        },
        [
            api,
            catalogPrompt,
            model,
            getAccessToken,
            customHeaders,
            initialTree,
            onComplete,
            onError,
        ],
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    return {
        spec,
        isStreaming,
        error,
        send,
        clear,
    };
}

/**
 * Convert a flat element list to a UITree
 */
export function flatToTree(
    elements: FlatElement[],
): Spec {
    const elementMap: Record<string, UIElement> = {};
    let root = "";

    // First pass: add all elements to map
    for (const element of elements) {
        elementMap[element.key] = {
            type: element.type,
            props: element.props,
            children: [],
            visible: element.visible,
        };
    }

    // Second pass: build parent-child relationships
    for (const element of elements) {
        if (element.parentKey) {
            const parent = elementMap[element.parentKey];
            if (parent) {
                if (!parent.children) {
                    parent.children = [];
                }
                parent.children.push(element.key);
            }
        } else {
            root = element.key;
        }
    }

    return { root, elements: elementMap };
}
