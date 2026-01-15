import type {
    ImageModelV3,
    ImageModelV3Usage
} from "@ai-sdk/provider"

const sumUsage = (results: any[]): ImageModelV3Usage => {
    return results.reduce<ImageModelV3Usage>(
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

export function createImageProvider(config: {
    baseUrl: string;
    headers?: any;
}) {
    return {
        imageModel(modelId: string, maxImagesPerCall?: number | undefined): ImageModelV3 {
            return {
                specificationVersion: 'v3',
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

                    return {
                        images,
                        warnings,
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






