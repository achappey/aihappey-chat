import { createCredentialScopedFetch } from "../../provider-credentials/scopedRequest";
import type { AgentDetailConfig } from "../../agents/remoteAgentDetails";
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
    agentConfig?: AgentDetailConfig;
    requestError?: string;
    directBaseUrl?: string;
};

/** Shared request authentication; callers pin these inputs for one execution. */
export function createAuthFetch({
    chatMode,
    getAccessToken,
    refreshToken,
    headers,
    customHeaders,
    customFetch,
    getDebugEnabled,
    agentConfig,
    requestError,
    directBaseUrl,
}: UseAuthFetchArgs) {
        if (
            !getAccessToken &&
            !refreshToken &&
            !headers &&
            !customHeaders &&
            !customFetch &&
            !getDebugEnabled &&
            !requestError &&
            !directBaseUrl
        ) return undefined;

        return async (input: RequestInfo | URL, init?: RequestInit) => {
            init?.signal?.throwIfAborted();
            if (requestError) throw new Error(requestError);
            if (directBaseUrl) {
                const origin = globalThis.location?.origin ?? "http://localhost";
                const target = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, origin);
                const provider = new URL(directBaseUrl, origin);
                const prefix = provider.pathname.replace(/\/+$/, "");
                if (target.origin !== provider.origin || (prefix && !target.pathname.startsWith(`${prefix}/`))) {
                    throw new Error("Direct provider credentials cannot be sent to a different endpoint.");
                }
            }
            const mode = chatMode;

            const h = new Headers();
            const base = { ...(headers ?? {}), ...(customHeaders ?? {}) };
            Object.entries(base).forEach(([k, v]) => { if (v != null) h.set(k, String(v)); });

            if (init?.headers) {
                new Headers(init.headers as any).forEach((v, k) => {
                    // A per-call header override must not replace the pinned provider key.
                    if (!directBaseUrl || !/^(authorization|proxy-authorization|api-key|x-api-key|x-goog-api-key|x-.+-key|cookie)$/i.test(k)) h.set(k, v);
                });
            }

            try {
                if (mode === "chat" && getAccessToken) {
                    const token = await getAccessToken();
                    if (token) h.set("Authorization", `Bearer ${token}`);
                } else if (mode === "agent" && refreshToken && !h.has("Authorization")) {
                    const token = await refreshToken();
                    if (token) h.set("Authorization", `Bearer ${token}`);
                }
            } catch (error) {
                if (mode === "chat" && getAccessToken) throw error;
                // keep existing Authorization
            }

            normalizeContentType(h);
            if (getDebugEnabled) setApiDebugHeader(h, input, getDebugEnabled());

            init?.signal?.throwIfAborted();
            const f = customFetch ?? fetch;
            if (typeof Request !== "undefined" && input instanceof Request) {
                const request = new Request(input, { ...init, headers: h, ...(directBaseUrl ? { credentials: "omit" } : {}) });
                return createCredentialScopedFetch(f, mode === "agent" ? agentConfig : undefined)(request);
            }

            return createCredentialScopedFetch(f, mode === "agent" ? agentConfig : undefined)(input, { ...init, headers: h, ...(directBaseUrl ? { credentials: "omit" } : {}) });
        };
}

export function useAuthFetch(args: UseAuthFetchArgs) {
    const { chatMode, getAccessToken, refreshToken, headers, customHeaders, customFetch,
        getDebugEnabled, agentConfig, requestError, directBaseUrl } = args;
    // A transport pins this credential snapshot for its entire run, including tool continuations.
    return useMemo(() => createAuthFetch(args), [chatMode, getAccessToken, refreshToken, headers,
        customHeaders, customFetch, getDebugEnabled, agentConfig, requestError, directBaseUrl]);
}
