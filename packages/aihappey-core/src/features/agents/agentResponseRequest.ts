import type { AgentResponseApiCreateRequest } from "aihappey-ai";
import type { Agent } from "aihappey-types";

/** Project an already-resolved selection onto the agent backend's Responses contract. */
export const buildAgentResponseSelection = (selection: {
    requestAgents: Agent[];
    models: string[];
}): Pick<AgentResponseApiCreateRequest, "model" | "models" | "agents"> => ({
    ...(selection.requestAgents.length ? { agents: selection.requestAgents } : {}),
    ...(selection.models.length === 1
        ? { model: selection.models[0] }
        : selection.models.length > 1 ? { models: selection.models } : {}),
});
