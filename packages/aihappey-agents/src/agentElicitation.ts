import type { Agent } from "aihappey-types";

/** Update only the elicitation portion of an agent's MCP client capabilities. */
export const setAgentElicitationEnabled = (agent: Agent, enabled: boolean): Agent => {
  const capabilities = agent.mcpClient?.capabilities ?? {};
  if (enabled) {
    return {
      ...agent,
      mcpClient: {
        ...agent.mcpClient,
        capabilities: { ...capabilities, elicitation: {} },
      },
    };
  }

  const { elicitation: _, ...otherCapabilities } = capabilities;
  return {
    ...agent,
    mcpClient: {
      ...agent.mcpClient,
      capabilities: Object.keys(otherCapabilities).length ? otherCapabilities : undefined,
    },
  };
};

export const setAgentElicitationFormEnabled = (agent: Agent, enabled: boolean): Agent => {
  const capabilities = agent.mcpClient?.capabilities;
  const elicitation = capabilities?.elicitation;
  if (!elicitation) return agent;

  const { form: _, ...otherModes } = elicitation;
  return {
    ...agent,
    mcpClient: {
      ...agent.mcpClient,
      capabilities: {
        ...capabilities,
        elicitation: enabled ? { ...otherModes, form: {} } : otherModes,
      },
    },
  };
};
