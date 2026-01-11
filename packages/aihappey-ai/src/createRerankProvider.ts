import type {
    RerankingModelV3
} from "@ai-sdk/provider"

export function createRerankProvider(config: {
    baseUrl: string;
    headers?: any;
}) {
    return {
        rerankingModel(modelId: string): RerankingModelV3 {
            return {
                specificationVersion: 'v3',
                provider: modelId.split("/")?.[0],
                modelId,

                async doRerank(options) {
                    const {
                        documents,
                        query,
                        topN,
                        providerOptions
                    } = options;

                    const result = await fetch(`${config.baseUrl}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(config.headers ?? {})
                        },
                        body: JSON.stringify({
                            model: modelId,
                            documents,
                            query,
                            topN,
                            providerOptions,
                        })
                    })

                    if (!result.ok) {
                        throw new Error(`Reranking failed (${await result.text()})`);
                    }

                    return result.json();
                }
            };
        }
    };
}






