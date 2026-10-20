import { createCredentialScopedFetch } from "../../provider-credentials/scopedRequest";
// useAuthFetch.ts
import { useMemo } from "react";
import { setApiDebugHeader } from "./apiDebug";

function normalizeContentType(headers: Headers) {
    const contentType = headers.get("Content-Type") ?? headers.get("content-type");
    if (!contentType) return;

    const values = contentType
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

    if (values.length <= 1) return;

    const uniqueValues = Array.from(new Set(values.map((value) => value.toLowerCase())));
    if (uniqueValues.length === 1) {
        headers.set("Content-Type", values[0]);
        return;
    }

    headers.set("Content-Type", values[0]);
}

type UseAuthFetchArgs = {
    chatMode: "chat" | "agent";
    getAccessToken?: () => Promise<string>;
    refreshToken?: () => Promise<string | undefined>;
    headers?: Record<string, string>;
    customHeaders?: Record<string, string>;
    customFetch?: typeof fetch;
    getDebugEnabled?: () => boolean;
};

export function useAuthFetch({
    chatMode,
    getAccessToken,
    refreshToken,
    headers,
    customHeaders,
    customFetch,
    getDebugEnabled,
}: UseAuthFetchArgs) {
    // A transport pins this credential snapshot for its entire run, including tool continuations.
    return useMemo(() => {
        if (
            !getAccessToken &&
            !refreshToken &&
            !headers &&
            !customHeaders &&
            !customFetch &&
            !getDebugEnabled
        ) return undefined;

        return async (input: RequestInfo | URL, init?: RequestInit) => {
            const mode = chatMode;

            const h = new Headers();
            const base = { ...(headers ?? {}), ...(customHeaders ?? {}) };
            Object.entries(base).forEach(([k, v]) => { if (v != null) h.set(k, String(v)); });

            if (init?.headers) {
                new Headers(init.headers as any).forEach((v, k) => h.set(k, v));
            }

            try {
                if (mode === "chat" && getAccessToken && !h.has("Authorization") && !h.has("x-api-key")) {
                    const token = await getAccessToken();
                    if (token) h.set("Authorization", `Bearer ${token}`);
                } else if (mode === "agent" && refreshToken && !h.has("Authorization")) {
                    const token = await refreshToken();
                    if (token) h.set("Authorization", `Bearer ${token}`);
                }
            } catch {
                // keep existing Authorization
            }

            normalizeContentType(h);
            if (getDebugEnabled) setApiDebugHeader(h, input, getDebugEnabled());

            const f = customFetch ?? fetch;
            if (typeof Request !== "undefined" && input instanceof Request) {
                const request = new Request(input, { ...init, headers: h });
                return createCredentialScopedFetch(f)(request);
            }

            return createCredentialScopedFetch(f)(input, { ...init, headers: h });
        };
    }, [chatMode, getAccessToken, refreshToken, headers, customHeaders, customFetch, getDebugEnabled]);
}
