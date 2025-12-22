import { Agent } from "aihappey-types";
import type { StateCreator } from "zustand";

export type AgentSlice = {
    agents: Agent[];
    selectedAgentNames: string[];
    workflowType: string
    maximumIterationCount: number
    handoffs: any[]
    setAgents: (agents: Agent[]) => void
    setWorkflowType: (workflowType: string) => void
    setHandoffs: (handoffs: any[]) => void
    setMaximumIterationCount: (count: number) => void
    setSelectedAgents: (agents: string[]) => void
    createAgent: (agent: Agent) => void
    updateAgent: (name: string, agent: Agent) => void
    deleteAgent: (name: string) => void
    toggleAgentMcpServer: (agentName: string, key: string) => void
    updateAgentPolicy: (agentName: string, key: string, value: boolean) => void
    updateAgentClientCapabilities: (agentName: string, key: string, value: any) => void
};

export const createAgentSlice: StateCreator<
    any,
    [],
    [],
    AgentSlice
> = (set, get, store) => ({
    agents: [],
    selectedAgentNames: [],
    maximumIterationCount: 5,
    handoffs: [],
    // in your create(...) slice implementation
    updateAgentPolicy: (agentName, key, value) =>
        set((state: AgentSlice) => ({
            agents: state.agents.map(a =>
                a.name !== agentName
                    ? a
                    : {
                        ...a,
                        mcpClient: {
                            ...(a.mcpClient ?? {}),
                            policy: {
                                ...(a.mcpClient?.policy ?? {}),
                                [key]: value
                            }
                        }
                    }
            )
        })),

    updateAgentClientCapabilities: (agentName, key, value) =>
        set((state: AgentSlice) => ({
            agents: state.agents.map(a =>
                a.name !== agentName
                    ? a
                    : {
                        ...a,
                        mcpClient: {
                            ...(a.mcpClient ?? {}),
                            capabilities: {
                                ...(a.mcpClient?.capabilities ?? {}),
                                [key]: value
                            }
                        }
                    }
            )
        })),

    toggleAgentMcpServer: (agentName, key) =>
        set((state: AgentSlice) => ({
            agents: state.agents.map(a => {
                if (a.name !== agentName) return a

                const servers = a.mcpServers ?? {}
                const server = servers[key]
                if (!server) return a

                return {
                    ...a,
                    mcpServers: {
                        ...servers,
                        [key]: {
                            ...server,
                            disabled: !server.disabled
                        }
                    }
                }
            })
        }))
    ,
    setHandoffs: (handoffs) => {
        set((state: any) => ({
            handoffs: handoffs,
        }));
    },
    workflowType: "concurrent",
    setMaximumIterationCount: (count) => {
        set((state: any) => ({
            maximumIterationCount: count,
        }));
    },
    setWorkflowType: (workflowType) => {
        set((state: any) => ({
            workflowType: workflowType,
        }));
    },
    setAgents: (agents) => {
        set((state: any) => ({
            agents: agents,
        }));
    },
    setSelectedAgents: (agents) => {
        set((state: any) => ({
            selectedAgentNames: agents,
        }));
    },
    createAgent: (agent) =>
        set((state: AgentSlice) => {
            if (state.agents.some((a) => a.name === agent.name)) {
                throw new Error(`Agent with name '${agent.name}' already exists`);
            }

            return {
                agents: [...state.agents, agent],
            };
        }),

    updateAgent: (name: string, agent) =>
        set((state: AgentSlice) => {
            const index = state.agents.findIndex((a) => a.name === name);
            if (index === -1) {
                throw new Error(`Agent '${name}' not found`);
            }

            if (agent.name && agent.name !== name) {
                throw new Error("Agent name cannot be changed");
            }

            const prev = state.agents[index];

            /*      const prevProvider =
                    prev.model?.id?.split("/")?.[0];
                const nextProvider =
                    agent.model?.id?.split("/")?.[0];
    
              const providerChanged =
                    prevProvider &&
                    nextProvider &&
                    prevProvider !== nextProvider;*/

            const next = [...state.agents];

            next[index] = {
                ...prev,
                ...agent,
                name, // hard lock
                model: {
                    ...(prev.model ?? {}),
                    ...(agent.model ?? {}),
                    /*   providerMetadata: providerChanged
                           ? {
                               ...defaultProviderMetadata[nextProvider as keyof typeof defaultProviderMetadata]
                           }
                           : agent.model?.providerMetadata ?? prev.model?.providerMetadata,*/
                },

            };

            return { agents: next };
        }),
    deleteAgent: (name: string) =>
        set((state: AgentSlice) => {
            const exists = state.agents.some((a) => a.name === name);
            if (!exists) {
                throw new Error(`Agent '${name}' not found`);
            }

            return {
                agents: state.agents.filter((a) => a.name !== name),
            };
        }),

});