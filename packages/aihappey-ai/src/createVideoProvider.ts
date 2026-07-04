import type {
    Experimental_VideoModelV4,
    Experimental_VideoModelV4CallOptions,
} from "@ai-sdk/provider"

export function createVideoProvider(config: {
    baseUrl: string;
    headers?: any;
}) {
    return {
        videoModel(modelId: string, maxVideosPerCall?: number | undefined): Experimental_VideoModelV4 {
            return {
                specificationVersion: 'v4',
                provider: modelId.split("/")?.[0],
                modelId,
                maxVideosPerCall: maxVideosPerCall,
                async doGenerate(options: Experimental_VideoModelV4CallOptions) {
                    const {
                        prompt,
                        n,
                        seed,
                        duration,
                        aspectRatio,
                        resolution,
                        image,
                        fps,
                        providerOptions,
                        inputReferences,
                        frameImages
                    } = options;

                    const max = maxVideosPerCall ?? n;
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
                                seed,
                                aspectRatio,
                                resolution,
                                image,
                                duration,
                                fps,
                                frameImages,
                                inputReferences,
                                n: batchN,
                                providerOptions
                            })
                        }).then(async res => {
                            if (!res.ok) {
                                throw new Error(`Video generation failed (${await res.text()})`);
                            }
                            return res.json();
                        });
                    });

                    const results = await Promise.all(requests);
                    const videos = results.flatMap(r => r.videos ?? []);
                    const warnings = results.flatMap(r => r.warnings ?? []);
                    const timestamp =
                        results.find(r => r?.response?.timestamp)?.response?.timestamp ??
                        new Date().toString();


                    return {
                        videos,
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






