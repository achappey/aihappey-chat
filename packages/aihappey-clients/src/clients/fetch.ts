import type { ClientAdapter } from "../shared/types";
import { createHeaders, headersToObject, resolveUrl } from "../shared/http";

const tryParseResponseBody = async (response: Response) => {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
        return response.json();
    }

    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
};

export const rawFetchClientAdapter: ClientAdapter = {
    id: "fetch",
    label: "Fetch API",
    supportsEndpoint: (endpoint) => endpoint.id !== "/api/chat",
    invoke: async ({ prepared, request }) => {
        const headers = await createHeaders(request.headers, request.getAccessToken);
        const url = resolveUrl(request.baseUrl, prepared.path);
        const requestBody = prepared.body;
        const response = await fetch(url, {
            method: prepared.method,
            headers,
            body: JSON.stringify(requestBody),
        });

        const responseBody = await tryParseResponseBody(response);

        if (!response.ok) {
            throw new Error(
                typeof responseBody === "string"
                    ? responseBody
                    : `Request failed with status ${response.status}`,
            );
        }

        const parsed = prepared.parseResponse(responseBody);
        return {
            ...parsed,
            inspection: {
                url,
                method: prepared.method,
                headers: headersToObject(headers),
                requestBody,
                responseBody,
            },
        };
    },
};

