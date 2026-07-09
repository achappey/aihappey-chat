import type {
    ImageModelV4,
    ImageModelV4Usage
} from "@ai-sdk/provider"

const sumUsage = (results: any[]): ImageModelV4Usage => {
    return results.reduce<ImageModelV4Usage>(
        (acc, r) => {
            const u = r?.usage;
            if (!u) return acc;

            acc.inputTokens =
                (acc.inputTokens ?? 0) + (u.inputTokens ?? 0);

            acc.outputTokens =
                (acc.outputTokens ?? 0) + (u.outputTokens ?? 0);

            acc.totalTokens =
                (acc.totalTokens ?? 0) + (u.totalTokens ?? 0);

            return acc;
        },
        {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
        }
    );
};

const splitMetadataPerImage = (value: any, imageCount: number) => {
    if (imageCount <= 0) return [];

    const cost = value?.cost;
    const perImageCost = typeof cost === "number" && Number.isFinite(cost)
        ? cost / imageCount
        : undefined;

    return Array.from({ length: imageCount }, () => ({
        ...(value && typeof value === "object" ? value : {}),
        ...(perImageCost !== undefined ? { cost: perImageCost } : {})
    }));
};

const mergeProviderMetadata = (results: any[]) => {
    const providerMetadata = results.reduce<Record<string, any>>((acc, result) => {
        const metadata = result?.providerMetadata;
        if (!metadata || typeof metadata !== "object") return acc;

        const imageCount = Array.isArray(result?.images) ? result.images.length : 0;

        Object.entries(metadata).forEach(([key, value]) => {
            const perImageMetadata = splitMetadataPerImage(value, imageCount);

            if (key === "gateway") {
                const currentCost = acc.gateway?.cost;
                const nextCost = (value as any)?.cost;
                const gatewayMetadata = { ...((value && typeof value === "object" ? value : {}) as Record<string, any>) };
                delete gatewayMetadata.cost;
                delete gatewayMetadata.images;

                acc.gateway = {
                    ...(acc.gateway ?? {}),
                    ...gatewayMetadata,
                    images: [
                        ...(Array.isArray(acc.gateway?.images) ? acc.gateway.images : []),
                        ...perImageMetadata
                    ],
                    ...(typeof currentCost === "number" || typeof nextCost === "number" ? {
                        cost: (typeof currentCost === "number" && Number.isFinite(currentCost) ? currentCost : 0)
                            + (typeof nextCost === "number" && Number.isFinite(nextCost) ? nextCost : 0)
                    } : {})
                };
                return;
            }

            const providerMetadata = { ...((value && typeof value === "object" ? value : {}) as Record<string, any>) };
            delete providerMetadata.images;

            acc[key] = {
                ...(acc[key] ?? {}),
                ...providerMetadata,
                images: [
                    ...(Array.isArray(acc[key]?.images) ? acc[key].images : []),
                    ...perImageMetadata
                ]
            };
        });

        return acc;
    }, {});

    return Object.keys(providerMetadata).length > 0 ? providerMetadata : undefined;
};

export function createImageProvider(config: {
    baseUrl: string;
    headers?: any;
}) {
    return {
        imageModel(modelId: string, maxImagesPerCall?: number | undefined): ImageModelV4 {
            return {
                specificationVersion: 'v4',
                provider: modelId.split("/")?.[0],
                maxImagesPerCall: maxImagesPerCall,
                modelId,

                async doGenerate(options) {
                    const {
                        prompt,
                        size,
                        n = 1,
                        aspectRatio,
                        seed,
                        files,
                        mask,
                        providerOptions
                    } = options;

                    const max = maxImagesPerCall ?? n;
                    const batches = Math.ceil(n / max);

                    const requests = Array.from({ length: batches }, (_, i) => {
                        const batchN = Math.min(max, n - i * max);

                        return fetch(config.baseUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                ...(config.headers ?? {})
                            },
                            body: JSON.stringify({
                                model: modelId,
                                prompt,
                                files,
                                mask,
                                seed,
                                aspectRatio,
                                n: batchN,
                                providerOptions,
                                size
                            })
                        }).then(async res => {
                            if (!res.ok) {
                                throw new Error(`Image generation failed (${await res.text()})`);
                            }
                            return res.json();
                        });
                    });

                    const results = await Promise.all(requests);
                    const images = results.flatMap(r => r.images ?? []);
                    const warnings = results.flatMap(r => r.warnings ?? []);
                    const timestamp =
                        results.find(r => r?.response?.timestamp)?.response?.timestamp ??
                        new Date().toString();

                    const usage = sumUsage(results);
                    const providerMetadata = mergeProviderMetadata(results);

                    return {
                        images,
                        warnings,
                        providerMetadata,
                        response: {
                            timestamp,
                            modelId,
                            headers: undefined
                        },
                        usage
                    };
                }
            };
        }
    };
}






