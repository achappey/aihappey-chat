import type { EmbeddingModelV4 } from "@ai-sdk/provider"

export function createEmbeddingsProvider(config: {
    baseUrl: string;
    headers?: Record<string, string>;
}) {
    return {
        embeddingModel(modelId: string): EmbeddingModelV4 {
            return {
                specificationVersion: 'v4',
                provider: modelId.split('/')?.[0],
                modelId,
                maxEmbeddingsPerCall: undefined,
                supportsParallelCalls: true,

                async doEmbed(options) {
                    const result = await fetch(config.baseUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(config.headers ?? {}),
                            ...Object.fromEntries(
                                Object.entries(options.headers ?? {})
                                    .filter((entry): entry is [string, string] => entry[1] !== undefined)
                            )
                        },
                        body: JSON.stringify({
                            model: modelId,
                            values: options.values,
                            providerOptions: options.providerOptions
                        }),
                        signal: options.abortSignal
                    });

                    if (!result.ok) {
                        throw new Error(`Embedding failed (${await result.text()})`);
                    }

                    return result.json();
                }
            };
        }
    };
}
