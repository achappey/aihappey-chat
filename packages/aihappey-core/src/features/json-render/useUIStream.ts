"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { UITree, UIElement, JsonPatch } from "@json-render/core";
import { setByPath } from "@json-render/core";

/**
 * Parse a single JSON patch line
 */
function parsePatchLine(line: string): JsonPatch | null {
    try {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("//")) {
            return null;
        }
        return JSON.parse(trimmed) as JsonPatch;
    } catch {
        return null;
    }
}

/**
 * Apply a JSON patch to the current tree
 */
function applyPatch(tree: UITree, patch: JsonPatch): UITree {
    const newTree = { ...tree, elements: { ...tree.elements } };

    switch (patch.op) {
        case "set":
        case "add":
        case "replace": {
            // Handle root path
            if (patch.path === "/root") {
                newTree.root = patch.value as string;
                return newTree;
            }

            // Handle elements paths
            if (patch.path.startsWith("/elements/")) {
                const pathParts = patch.path.slice("/elements/".length).split("/");
                const elementKey = pathParts[0];

                if (!elementKey) return newTree;

                if (pathParts.length === 1) {
                    // Setting entire element
                    newTree.elements[elementKey] = patch.value as UIElement;
                } else {
                    // Setting property of element
                    const element = newTree.elements[elementKey];
                    if (element) {
                        const propPath = "/" + pathParts.slice(1).join("/");
                        const newElement = { ...element };
                        setByPath(
                            newElement as unknown as Record<string, unknown>,
                            propPath,
                            patch.value,
                        );
                        newTree.elements[elementKey] = newElement;
                    }
                }
            }
            break;
        }
        case "remove": {
            if (patch.path.startsWith("/elements/")) {
                const elementKey = patch.path.slice("/elements/".length).split("/")[0];
                if (elementKey) {
                    const { [elementKey]: _, ...rest } = newTree.elements;
                    newTree.elements = rest;
                }
            }
            break;
        }
    }

    return newTree;
}

/**
 * Options for useUIStream
 */
export interface UseUIStreamOptions {
    /** API endpoint */
    api: string;
    /** Callback when complete */
    onComplete?: (tree: UITree) => void;
    /** Callback on error */
    onError?: (error: Error) => void;
}

/**
 * Return type for useUIStream
 */
export interface UseUIStreamReturn {
    /** Current UI tree */
    tree: UITree | null;
    /** Whether currently streaming */
    isStreaming: boolean;
    /** Error if any */
    error: Error | null;
    /** Send a prompt to generate UI */
    send: (prompt: string, context?: Record<string, unknown>, providerMetadata?: any) => Promise<any>;
    /** Clear the current tree */
    clear: () => void;
}



export async function makeHeaders(getAccessToken: any) {
    const tokenHeaders = getAccessToken
        ? { "Authorization": "Bearer " + await getAccessToken() }  // must return an object like { Authorization: "Bearer ..." }
        : {};

    return {
        "Content-Type": "application/json",
        ...tokenHeaders,
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
    onComplete,
    onError,
}: any): UseUIStreamReturn {
    const [tree, setTree] = useState<UITree | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const clear = useCallback(() => {
        setTree(null);
        setError(null);
    }, []);


    const send = useCallback(
        async (prompt: string, context?: Record<string, unknown>, providerMetadata?: any) => {
            // Abort any existing request
            abortControllerRef.current?.abort();
            abortControllerRef.current = new AbortController();

            setIsStreaming(true);
            setError(null);
            let currentTree: UITree = tree ?? { root: "", elements: {} };
            // if (tree == null)
            //  setTree(currentTree);

            const headers: any = await makeHeaders(getAccessToken);
            try {
                const response = await fetch(api, {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify({
                        prompt,
                        model,
                        context,
                        catalogPrompt,
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
                            currentTree = applyPatch(currentTree, patch);
                            setTree({ ...currentTree });
                        }
                    }
                }

                // Process any remaining buffer
                if (buffer.trim()) {
                    const patch = parsePatchLine(buffer);
                    if (patch) {
                        currentTree = applyPatch(currentTree, patch);
                        setTree({ ...currentTree });
                    }
                }

                onComplete?.(currentTree);

                return currentTree;
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
        [api, onComplete, onError, tree],
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    return {
        tree,
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
    elements: Array<UIElement & { parentKey?: string | null }>,
): UITree {
    const elementMap: Record<string, UIElement> = {};
    let root = "";

    // First pass: add all elements to map
    for (const element of elements) {
        elementMap[element.key] = {
            key: element.key,
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
