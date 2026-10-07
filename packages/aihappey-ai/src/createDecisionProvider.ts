import type {
    Experimental_DecisionModelV4 as DecisionModelV4,
    Experimental_DecisionModelV4CallOptions as DecisionModelV4CallOptions,
    Experimental_DecisionModelV4Result as DecisionModelV4Result
} from "@ai-sdk/provider";

export function createDecisionProvider(config: {
    baseUrl: string;
    headers?: Record<string, string>;
}) {
    return {
        decisionModel(modelId: string): DecisionModelV4 {
            return {
                specificationVersion: "v4",
                supportedQuestionTypes: ["boolean", "choice", "score"] as const,
                provider: modelId.split("/")?.[0],
                modelId,

                async doDecide(options: DecisionModelV4CallOptions): Promise<DecisionModelV4Result> {
                    const result = await fetch(config.baseUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...(config.headers ?? {})
                        },
                        body: JSON.stringify({
                            model: modelId,
                            ...options
                        })
                    });

                    if (!result.ok) {
                        throw new Error(
                            `Decision failed (${await result.text()})`
                        );
                    }

                    return result.json();
                }
            };
        }
    };
}