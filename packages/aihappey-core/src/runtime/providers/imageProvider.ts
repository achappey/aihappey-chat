import type { ImageModelV3 } from 'aihappey-ai';

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

                        return fetch(`${config.baseUrl}/v1/images/generations`, {
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

                    return {
                        images,
                        warnings,
                        response: {
                            timestamp,
                            modelId,
                            headers: undefined
                        }
                    };
                }


            };
        }
    };
}






