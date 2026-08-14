import {
    DEFAULT_SIDE_INFERENCE_AGENT_SELECTION,
    store,
} from "aihappey-state";
import type { SideInferenceAgentCallOptions } from "./sideInferenceAgentCall";
import { invokeSideInferenceAgent } from "./sideInferenceAgentCall";

export const conversationName = async (
    message: string,
    language: string,
    options: SideInferenceAgentCallOptions = {}
) => {
    const state = store.getState();
    return invokeSideInferenceAgent({
        ...options,
        feature: "conversationName",
        agents: options.agents ?? state.agents,
        models: options.models ?? state.models,
        customHeaders: options.customHeaders ?? state.customHeaders,
        agentName: options.agentName
            ?? state.sideInferenceAgentNames?.conversationNameAgent
            ?? DEFAULT_SIDE_INFERENCE_AGENT_SELECTION.conversationNameAgent,
        fallback: options.fallback ?? "New chat",
        input: {
            userMessage: message,
            language,
        },
    });
};
