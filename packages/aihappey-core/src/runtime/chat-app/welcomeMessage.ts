import {
    DEFAULT_SIDE_INFERENCE_AGENT_SELECTION,
    store,
} from "aihappey-state";
import type { SideInferenceAgentCallOptions } from "./sideInferenceAgentCall";
import { invokeSideInferenceAgent } from "./sideInferenceAgentCall";

export const fetchWelcomeMessage = async (language: string,
    currentUser?: string | null,
    options: SideInferenceAgentCallOptions = {}) => {
    const state = store.getState();
    return invokeSideInferenceAgent({
        ...options,
        feature: "welcomeMessage",
        agents: options.agents ?? state.agents,
        models: options.models ?? state.models,
        customHeaders: options.customHeaders ?? state.customHeaders,
        agentName: options.agentName
            ?? state.sideInferenceAgentNames?.welcomeMessageAgent
            ?? DEFAULT_SIDE_INFERENCE_AGENT_SELECTION.welcomeMessageAgent,
        fallback: options.fallback ?? "Welcome",
        input: {
        language: language,
        currentUser: currentUser ?? null,
        currentDateTime: new Date().toLocaleString(navigator.language,
            { timeZoneName: "long" }),
        },
    });
};
