export const CONVERSATION_NAME_AGENT_NAME = "ConversationNameAgent";
export const WELCOME_MESSAGE_AGENT_NAME = "WelcomeMessageAgent";
export const EXPLAIN_TOOL_CALL_AGENT_NAME = "ExplainToolcallAgent";
export const TOOL_SEARCH_AGENT_NAME = "ToolSearchAgent";

export const SIDE_INFERENCE_DEFAULT_AGENT_NAMES = {
  conversationName: CONVERSATION_NAME_AGENT_NAME,
  welcomeMessage: WELCOME_MESSAGE_AGENT_NAME,
  explainToolCall: EXPLAIN_TOOL_CALL_AGENT_NAME,
  toolSearch: TOOL_SEARCH_AGENT_NAME,
} as const;

import type { Agent } from "aihappey-types";

const cloneAgent = (agent: Agent): Agent => JSON.parse(JSON.stringify(agent));

export const cloneAgents = (agents: Agent[] = []): Agent[] =>
  (agents ?? []).filter(Boolean).map(cloneAgent);

export const ensureDefaultAgents = (
  agents: Agent[] = [],
  defaultAgents: Agent[] = []
): Agent[] => {
  const mergedAgents = [...(agents ?? []), ...(defaultAgents ?? [])];
  const seenNames = new Set<string>();

  return mergedAgents.reduce<Agent[]>((result, agent) => {
    const name = agent?.name?.trim();
    if (!name || seenNames.has(name)) {
      return result;
    }

    seenNames.add(name);
    result.push(cloneAgent({
      ...agent,
      name,
    }));
    return result;
  }, []);
};
