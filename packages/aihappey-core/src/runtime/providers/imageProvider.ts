import type { ImageModel, ImageModelV3 } from 'aihappey-ai';

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
                    const { prompt, size, n, aspectRatio, seed,
                        files, mask, providerOptions } = options;

                    const res = await fetch(`${config.baseUrl}/v1/images/generations`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(config.headers
                                ? { ...config.headers }
                                : {})
                        },
                        body: JSON.stringify({
                            model: modelId,
                            prompt,
                            files,
                            mask,
                            seed,
                            aspectRatio,
                            n,
                            providerOptions,
                            size
                        })
                    });

                    if (!res.ok) {
                        throw new Error(`Image generation failed (${await res.text()})`);
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