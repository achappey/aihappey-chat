import {
    Agent,
    RemoteAgentModel,
    isLocalAgentSelectionKey,
    isRemoteAgentSelectionKey,
    normalizeAgentSelectionValue,
    toLocalAgentSelectionKey,
    toRemoteAgentSelectionKey,
} from "aihappey-types";

export type AgentSelectionEntry = {
    key: string;
    kind: "local" | "remote";
    label: string;
    backendId: string;
    description?: string;
    modelId?: string;
    argumentHint?: string;
    localAgent?: Agent;
    remoteAgentModel?: RemoteAgentModel;
};

const createLocalEntry = (agent: Agent): AgentSelectionEntry => ({
    key: toLocalAgentSelectionKey(agent.name),
    kind: "local",
    label: agent.name,
    backendId: agent.name,
    description: agent.description,
    modelId: agent.model?.id,
    argumentHint: agent.argumentHint,
    localAgent: agent,
});

const createRemoteEntry = (remoteAgentModel: RemoteAgentModel): AgentSelectionEntry => ({
    key: toRemoteAgentSelectionKey(remoteAgentModel.id),
    kind: "remote",
    label: `${remoteAgentModel.name ?? remoteAgentModel.id}`,
    backendId: remoteAgentModel.id,
    description:
        remoteAgentModel.description,
    modelId: remoteAgentModel.id,
    remoteAgentModel,
});

export const normalizeSelectedAgentKeys = (
    selectedValues: string[] | undefined,
    localAgents: Agent[],
    remoteAgentModels: RemoteAgentModel[],
) => {
    const localAgentNames = localAgents.map((agent) => agent.name);
    const remoteAgentIds = remoteAgentModels.map((model) => model.id);

    return Array.from(new Set(
        (selectedValues ?? [])
            .map((value) => normalizeAgentSelectionValue(
                String(value ?? "").trim(),
                localAgentNames,
                remoteAgentIds,
            ))
            .filter(Boolean)
    ));
};

export const buildAvailableAgentSelectionEntries = (
    localAgents: Agent[],
    remoteAgentModels: RemoteAgentModel[],
    enabledProviders: string[] = [],
    alwaysVisibleAgentKeys: string[] = [],
) => {
    const enabledProviderKeys = enabledProviders.map((provider) => provider.toLowerCase());
    const alwaysVisibleSet = new Set((alwaysVisibleAgentKeys ?? []).filter(Boolean));

    const visibleLocalAgents = localAgents.filter((agent) => {
        if (alwaysVisibleSet.has(toLocalAgentSelectionKey(agent.name))) return true;

        const providerKey = String(agent.model?.id ?? "").split("/")[0]?.toLowerCase();
        return enabledProviderKeys.includes(providerKey);
    });

    return [
        ...visibleLocalAgents.map(createLocalEntry),
        ...remoteAgentModels.map(createRemoteEntry),
    ];
};

export const resolveSelectedAgentEntries = (
    selectedValues: string[] | undefined,
    localAgents: Agent[],
    remoteAgentModels: RemoteAgentModel[],
) => {
    const localAgentMap = new Map(localAgents.map((agent) => [agent.name, agent]));
    const remoteAgentMap = new Map(remoteAgentModels.map((model) => [model.id, model]));

    return normalizeSelectedAgentKeys(selectedValues, localAgents, remoteAgentModels)
        .map((value) => {
            if (isLocalAgentSelectionKey(value)) {
                const agent = localAgentMap.get(value.slice("local:".length));
                return agent ? createLocalEntry(agent) : null;
            }

            if (isRemoteAgentSelectionKey(value)) {
                const remoteAgentModel = remoteAgentMap.get(value.slice("remote:".length));
                return remoteAgentModel ? createRemoteEntry(remoteAgentModel) : null;
            }

            const localAgent = localAgentMap.get(value);
            if (localAgent) return createLocalEntry(localAgent);

            const remoteAgentModel = remoteAgentMap.get(value);
            return remoteAgentModel ? createRemoteEntry(remoteAgentModel) : null;
        })
        .filter((entry): entry is AgentSelectionEntry => !!entry);
};

export const buildSelectedAgentRequest = (
    selectedValues: string[] | undefined,
    localAgents: Agent[],
    remoteAgentModels: RemoteAgentModel[],
) => {
    const entries = resolveSelectedAgentEntries(selectedValues, localAgents, remoteAgentModels);

    return {
        entries,
        localAgents: entries
            .filter((entry) => entry.kind === "local")
            .map((entry) => entry.localAgent!)
            .filter(Boolean),
        remoteAgentModels: entries
            .filter((entry) => entry.kind === "remote")
            .map((entry) => entry.remoteAgentModel!)
            .filter(Boolean),
        models: entries
            .filter((entry) => entry.kind === "remote")
            .map((entry) => entry.backendId),
    };
};
