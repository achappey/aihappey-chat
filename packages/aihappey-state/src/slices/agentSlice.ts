import {
    Agent,
    RemoteAgentModel,
    normalizeAgentSelectionValue,
    toLocalAgentSelectionKey,
} from "aihappey-types";
import type { StateCreator } from "zustand";
import { defaultAgents, ensureDefaultAgents } from "./defaultAgents";
import { resolveAgentModelProviderMetadata } from "./agentModelProviderMetadata";

export type AgentSlice = {
    agents: Agent[];
    remoteAgentModels: RemoteAgentModel[];
    remoteAgentModelsLoaded: boolean;
    selectedAgentNames: string[];
    favoriteAgentIds: string[];
    workflowType: string
    maximumIterationCount: number
    handoffs: any[]
    setAgents: (agents: Agent[]) => void
    setRemoteAgentModels: (models: RemoteAgentModel[]) => void
    setWorkflowType: (workflowType: string) => void
    setHandoffs: (handoffs: any[]) => void
    setMaximumIterationCount: (count: number) => void
    setSelectedAgents: (agents: string[]) => void
    setFavoriteAgentIds: (agentIds: string[]) => void
    toggleFavoriteAgent: (agentId: string) => void
    restoreDefaultAgents: () => void
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
    agents: defaultAgents,
    remoteAgentModels: [],
    remoteAgentModelsLoaded: false,
    selectedAgentNames: [],
    favoriteAgentIds: [],
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
    setRemoteAgentModels: (models) => {
        set(() => ({
            remoteAgentModels: models,
            remoteAgentModelsLoaded: true,
        }));
    },
    setSelectedAgents: (agents) => {
        set((state: AgentSlice) => ({
            selectedAgentNames: Array.from(new Set(
                (agents ?? [])
                    .map((value) => normalizeAgentSelectionValue(
                        String(value ?? "").trim(),
                        state.agents.map((agent) => agent.name),
                        state.remoteAgentModels.map((model) => model.id),
                    ))
                    .filter(Boolean)
            )),
        }));
    },
    setFavoriteAgentIds: (agentIds) => {
        set(() => ({
            favoriteAgentIds: Array.from(new Set((agentIds ?? []).filter(Boolean))),
        }));
    },
    toggleFavoriteAgent: (agentId) => {
        set((state: AgentSlice) => {
            if (!agentId) return state;
            const current = state.favoriteAgentIds ?? [];
            const exists = current.includes(agentId);

            return {
                favoriteAgentIds: exists
                    ? current.filter((id) => id !== agentId)
                    : [...current, agentId],
            };
        });
    },
    restoreDefaultAgents: () => {
        set((state: AgentSlice) => ({
            agents: ensureDefaultAgents(state.agents),
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
            const mergedModel = {
                ...(prev.model ?? {}),
                ...(agent.model ?? {}),
            };
            const providerMetadata = resolveAgentModelProviderMetadata({
                previousModelId: prev.model?.id,
                nextModelId: mergedModel.id,
                previousProviderMetadata: prev.model?.providerMetadata,
                nextProviderMetadata: agent.model?.providerMetadata,
            });

            const next = [...state.agents];

            next[index] = {
                ...prev,
                ...agent,
                name, // hard lock
                model: {
                    ...mergedModel,
                    providerMetadata,
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
                favoriteAgentIds: (state.favoriteAgentIds ?? [])
                    .filter((id) => id !== toLocalAgentSelectionKey(name)),
            };
        }),

});
