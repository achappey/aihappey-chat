import type {
    Experimental_DecisionModelV4 as DecisionModelV4,
    Experimental_DecisionModelV4CallOptions as DecisionModelV4CallOptions,
    Experimental_DecisionModelV4Result as DecisionModelV4Result
} from "@ai-sdk/provider";
import type { UniversalDecisionState } from "./universalDecisionApi";

type GatewayDecisionCallOptions = Omit<DecisionModelV4CallOptions, "state"> & {
    state: UniversalDecisionState | DecisionModelV4CallOptions["state"];
};
type GatewayDecisionModel = Omit<DecisionModelV4, "doDecide"> & {
    doDecide(options: GatewayDecisionCallOptions): Promise<DecisionModelV4Result>;
};

export function createDecisionProvider(config: {
    baseUrl: string;
    headers?: Record<string, string>;
    fetch?: typeof fetch;
}) {
    return {
        decisionModel(modelId: string): GatewayDecisionModel {
            return {
                specificationVersion: "v4",
                supportedQuestionTypes: ["boolean", "choice", "score"] as const,
                provider: modelId.split("/")?.[0],
                modelId,

                async doDecide(options: GatewayDecisionCallOptions): Promise<DecisionModelV4Result> {
                    const headers = new Headers();
                    for (const [key, value] of Object.entries(options.headers ?? {})) {
                        if (value !== undefined) headers.set(key, value);
                    }
                    for (const [key, value] of Object.entries(config.headers ?? {})) headers.set(key, value);
                    headers.set("Content-Type", "application/json");
                    const result = await (config.fetch ?? fetch)(config.baseUrl, {
                        method: "POST",
                        headers,
                        signal: options.abortSignal,
                        body: JSON.stringify({
                            model: modelId,
                            state: options.state,
                            questions: options.questions,
                            headers: options.headers,
                            providerOptions: options.providerOptions,
                        })
                    });

                    if (!result.ok) {
                        throw new Error(
                            `Decision failed (${result.status} ${await result.text()})`
                        );
                    }

                    const response: DecisionModelV4Result = await result.json();
                    if (response.response?.timestamp) {
                        const timestamp = new Date(response.response.timestamp);
                        if (!Number.isFinite(timestamp.getTime())) throw new Error("Invalid decision response timestamp");
                        response.response.timestamp = timestamp;
                    }
                    return response;
                }
            };
        }
    };
}
