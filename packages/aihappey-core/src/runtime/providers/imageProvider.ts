import type { ImageModel } from 'aihappey-ai';


export function createImageProvider(config: {
    baseUrl: string;
    apiKey?: string;
}) {
    return {
        imageModel(modelId: string): ImageModel {
            return {
                specificationVersion: 'v3',
                provider: new URL(config.baseUrl).host,
                maxImagesPerCall: undefined,
                modelId,

                async doGenerate(options) {
                    const { prompt, size } = options;

                    const res = await fetch(`${config.baseUrl}/image`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(config.apiKey
                                ? { Authorization: `Bearer ${config.apiKey}` }
                                : {})
                        },
                        body: JSON.stringify({
                            model: modelId,
                            prompt,
                            size
                        })
                    });

                    if (!res.ok) {
                        throw new Error(`Image generation failed (${res.status})`);
                    }

                    const json = await res.json();

                    //  const warnings: SharedV3Warning[] = [];
return json;

          /*          return {
                        images: json.images as string[],

                        warnings: [],

                        response: {
                            timestamp: new Date(),
                            modelId,
                            headers: undefined
                        }
                    };*/
                }
            };
        }
    };
}