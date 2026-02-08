"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Spec, UIElement, FlatElement } from "@json-render/core";
import { parseSpecStreamLine, applySpecStreamPatch } from "@json-render/core";

/**
 * Parse a single JSON patch line
 */
function parsePatchLine(line: string) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) {
        return null;
    }

    return parseSpecStreamLine(trimmed);
}

/**
 * Apply a single SpecStream patch operation to the current spec.
 */
function applyPatch(spec: Spec, linePatch: NonNullable<ReturnType<typeof parseSpecStreamLine>>): Spec {
    const next = {
        ...spec,
        elements: { ...spec.elements },
    };

    applySpecStreamPatch(next as unknown as Record<string, unknown>, linePatch);
    return next;
}

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
            abortControllerRef.current = new AbortController();

            setIsStreaming(true);
            setError(null);
            let currentSpec: Spec =
                baseTree ?? specRef.current ?? initialTree ?? { root: "", elements: {} };
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
                    signal: abortControllerRef.current.signal,
                });

                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }

                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error("No response body");
                }

                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });

                    // Process complete lines
                    const lines = buffer.split("\n");
                    buffer = lines.pop() ?? "";

                    for (const line of lines) {
                        const patch = parsePatchLine(line);
                        if (patch) {
                            currentSpec = applyPatch(currentSpec, patch);
                            setSpec({ ...currentSpec });
                        }
                    }
                }

                // Process any remaining buffer
                if (buffer.trim()) {
                    const patch = parsePatchLine(buffer);
                    if (patch) {
                        currentSpec = applyPatch(currentSpec, patch);
                        setSpec({ ...currentSpec });
                    }
                }

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
                setIsStreaming(false);
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
