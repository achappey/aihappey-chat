import {
    DEFAULT_SIDE_INFERENCE_AGENT_SELECTION,
    store,
} from "aihappey-state";
import type { SideInferenceAgentCallOptions } from "./sideInferenceAgentCall";
import { invokeSideInferenceAgent } from "./sideInferenceAgentCall";

export const explainToolCall =
    async (
        toolcall: string,
        language: string,
        options: SideInferenceAgentCallOptions = {}
    ) => {
        const state = store.getState();
        return invokeSideInferenceAgent({
            ...options,
            feature: "explainToolCall",
            agents: options.agents ?? state.agents,
            models: options.models ?? state.models,
            customHeaders: options.customHeaders ?? state.customHeaders,
            agentName: options.agentName
                ?? state.sideInferenceAgentNames?.explainToolCallAgent
                ?? DEFAULT_SIDE_INFERENCE_AGENT_SELECTION.explainToolCallAgent,
            fallback: options.fallback ?? "The tool call could not be explained.",
            input: {
                toolcall,
                language,
            },
        });
    };
