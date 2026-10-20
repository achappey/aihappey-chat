import type {
    Experimental_DecisionModelV4 as DecisionModelV4,
    Experimental_DecisionModelV4CallOptions as DecisionModelV4CallOptions,
    Experimental_DecisionModelV4Result as DecisionModelV4Result
} from "@ai-sdk/provider";
import type { UniversalDecisionState } from "./universalDecisionApi";

export type GatewayDecisionCallOptions = Omit<DecisionModelV4CallOptions, "state"> & {
    state: UniversalDecisionState | DecisionModelV4CallOptions["state"];
    /** Set by sdkDecisionModel, not inferred from arbitrary legacy JSON. */
    stateFormat?: "sdk";
};
export type GatewayDecisionModel = Omit<DecisionModelV4, "doDecide"> & {
    doDecide(options: GatewayDecisionCallOptions): Promise<DecisionModelV4Result>;
};

export function createDecisionProvider(config: {
    baseUrl: string;
    headers?: Record<string, string>;
    fetch?: typeof fetch;
    /** Only override when the target gateway/model actually implements these types. */
    supportedQuestionTypes?: (modelId: string) => DecisionModelV4["supportedQuestionTypes"];
}) {
    return {
        decisionModel(modelId: string): GatewayDecisionModel {
            return {
                specificationVersion: "v4",
                supportedQuestionTypes: config.supportedQuestionTypes?.(modelId) ?? ["boolean", "choice", "score"] as const,
                provider: modelId.split("/")?.[0],
                modelId,

                async doDecide(options: GatewayDecisionCallOptions): Promise<DecisionModelV4Result> {
                    options.abortSignal?.throwIfAborted();
                    const supported = config.supportedQuestionTypes?.(modelId) ?? ["boolean", "choice", "score"];
                    for (const [id, question] of Object.entries(options.questions)) {
                        if (!supported.includes(question.type)) throw new Error(`Decision model '${modelId}' does not support '${question.type}' questions (question '${id}').`);
                    }
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
                            stateFormat: options.stateFormat,
                            questions: options.questions,
                            headers: options.headers,
                            providerOptions: options.providerOptions,
                            maxOutputTokens: options.maxOutputTokens,
                            reasoning: options.reasoning,
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
            } satisfies DecisionModelV4;
        },
        /** SDK parts are opt-in: never reinterpret a legacy JSON array as media. */
        sdkDecisionModel(modelId: string): DecisionModelV4 {
            const gateway = createDecisionProvider(config).decisionModel(modelId);
            return {
                ...gateway,
                doDecide(options: DecisionModelV4CallOptions) {
                    return gateway.doDecide({ ...options, state: serializeDecisionState(options.state), stateFormat: "sdk" });
                },
            } satisfies DecisionModelV4;
        },
    };
}

/** Convert non-JSON SDK file values without inspecting or altering legacy JSON. */
function serializeDecisionState(state: DecisionModelV4CallOptions["state"]): UniversalDecisionState {
    return JSON.parse(JSON.stringify(state.map(part => {
            if (part.type !== "file") return part;
            if (part.data.type === "data" && part.data.data instanceof Uint8Array) {
                let binary = "";
                for (const byte of part.data.data) binary += String.fromCharCode(byte);
                return { ...part, data: { type: "data", data: btoa(binary) } };
            }
            if (part.data.type === "url") return { ...part, data: { ...part.data, url: part.data.url.toString() } };
            return part;
        })));
}
