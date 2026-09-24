import { RealtimeResponse } from "./types";

export const getRealtimeToken = async (config: {
    baseUrl: string;
    headers?: any;
}) => {
    return async (request: any): Promise<RealtimeResponse> => {
        const result = await fetch(`${config.baseUrl}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(config.headers ?? {})
            },
            body: JSON.stringify({
                ...request
            })
        })

        if (!result.ok) {
            throw new Error(`Realtime token request failed (${result.status}): ${await result.text()}`);
        }

        return result.json();
    }
}
