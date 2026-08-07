import type { JSONValue } from "@ai-sdk/provider";
import type {
    VideoModelV4,
    VideoModelV4CallOptions,
    VideoModelV4OperationStartResult,
    VideoModelV4OperationStatusResult,
} from "./videoModelV4";

type VideoProviderConfig = {
    baseUrl: string;
    headers?: Record<string, string>;
};

function responseError(prefix: string, response: Response, body: string): Error {
    try {
        const parsed = JSON.parse(body);
        return new Error(`${prefix} (${parsed?.error ?? body})`);
    } catch {
        return new Error(`${prefix} (${body || response.statusText})`);
    }
}

function withResponseDate<T extends { response: { timestamp: Date | string } }>(value: T): T {
    return {
        ...value,
        response: {
            ...value.response,
            timestamp: new Date(value.response.timestamp),
        },
    };
}

function parseOperation(operation: JSONValue): { providerId: string; taskId: string } {
    if (typeof operation !== "string") {
        throw new Error("Video operation must be a provider-prefixed string.");
    }

    const separator = operation.indexOf("/");
    if (separator <= 0 || separator === operation.length - 1) {
        throw new Error(`Invalid provider-prefixed video operation '${operation}'.`);
    }

    return {
        providerId: operation.slice(0, separator),
        taskId: operation.slice(separator + 1),
    };
}

export function createVideoProvider(config: VideoProviderConfig) {
    const requestHeaders = () => ({
        "Content-Type": "application/json",
        ...(config.headers ?? {}),
    });

    return {
        videoModel(modelId: string, maxVideosPerCall?: number): VideoModelV4 {
            return {
                specificationVersion: "v4",
                provider: modelId.split("/")[0],
                modelId,
                maxVideosPerCall,

                async doStart(options: VideoModelV4CallOptions): Promise<VideoModelV4OperationStartResult> {
                    const response = await fetch(config.baseUrl, {
                        method: "POST",
                        headers: requestHeaders(),
                        signal: options.abortSignal,
                        body: JSON.stringify({
                            model: modelId,
                            prompt: options.prompt,
                            n: options.n,
                            seed: options.seed,
                            aspectRatio: options.aspectRatio,
                            resolution: options.resolution,
                            duration: options.duration,
                            fps: options.fps,
                            image: options.image,
                            frameImages: options.frameImages,
                            inputReferences: options.inputReferences,
                            generateAudio: options.generateAudio,
                            providerOptions: options.providerOptions,
                        }),
                    });
                    const body = await response.text();
                    if (!response.ok) throw responseError("Video generation failed", response, body);

                    return withResponseDate(JSON.parse(body));
                },

                async doStatus({ operation, abortSignal }): Promise<VideoModelV4OperationStatusResult> {
                    const { providerId, taskId } = parseOperation(operation);
                    const response = await fetch(
                        `${config.baseUrl}/${encodeURIComponent(providerId)}/${encodeURIComponent(taskId)}`,
                        {
                            method: "GET",
                            headers: requestHeaders(),
                            signal: abortSignal,
                        },
                    );
                    const body = await response.text();
                    if (!response.ok) throw responseError("Video status check failed", response, body);

                    return withResponseDate(JSON.parse(body));
                },
            };
        },
    };
}
