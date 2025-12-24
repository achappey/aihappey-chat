// useAuthFetch.ts
import { useEffect, useMemo, useRef } from "react";

function useLatestRef<T>(value: T) {
    const r = useRef(value);
    useEffect(() => { r.current = value; }, [value]);
    return r;
}

type UseAuthFetchArgs = {
    chatMode: "chat" | "agent";
    getAccessToken?: () => Promise<string>;
    refreshToken?: () => Promise<string | undefined>;
    headers?: Record<string, string>;
    customHeaders?: Record<string, string>;
    customFetch?: typeof fetch;
};

export function useAuthFetch({
    chatMode,
    getAccessToken,
    refreshToken,
    headers,
    customHeaders,
    customFetch,
}: UseAuthFetchArgs) {
    const chatModeRef = useLatestRef(chatMode);
    const getAccessTokenRef = useLatestRef(getAccessToken);
    const refreshTokenRef = useLatestRef(refreshToken);
    const headersRef = useLatestRef(headers);
    const customHeadersRef = useLatestRef(customHeaders);
    const customFetchRef = useLatestRef(customFetch);

    return useMemo(() => {
        if (
            !getAccessTokenRef.current &&
            !refreshTokenRef.current &&
            !headersRef.current &&
            !customHeadersRef.current &&
            !customFetchRef.current
        ) return undefined;

        return async (input: RequestInfo | URL, init?: RequestInit) => {
            const mode = chatModeRef.current;

            const h = new Headers();
            const base = { ...(headersRef.current ?? {}), ...(customHeadersRef.current ?? {}) };
            Object.entries(base).forEach(([k, v]) => { if (v != null) h.set(k, String(v)); });

            if (init?.headers) {
                new Headers(init.headers as any).forEach((v, k) => h.set(k, v));
            }

            try {
                if (mode === "chat" && getAccessTokenRef.current) {
                    const token = await getAccessTokenRef.current();
                    if (token) h.set("Authorization", `Bearer ${token}`);
                } else if (mode === "agent" && refreshTokenRef.current) {
                    const token = await refreshTokenRef.current();
                    if (token) h.set("Authorization", `Bearer ${token}`);
                }
            } catch {
                // keep existing Authorization
            }

            const f = customFetchRef.current ?? fetch;
            return f(input, { ...init, headers: h });
        };
    }, []);
}
