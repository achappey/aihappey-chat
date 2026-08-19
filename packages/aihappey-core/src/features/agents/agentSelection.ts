import {
    Agent,
    RemoteAgentModel,
    isLocalAgentSelectionKey,
    isRemoteAgentSelectionKey,
    normalizeAgentSelectionValue,
    toLocalAgentSelectionKey,
    toRemoteAgentSelectionKey,
} from "aihappey-types";

export type MagenticMetadata = {
    maxRounds?: number;
    maxResets?: number;
    maxStalls?: number;
    responseLanguage?: string;
};

export const buildWorkflowMetadata = (
    maximumIterationCount: number,
    handoffs: unknown[],
    magentic: MagenticMetadata,
) => ({
    groupchat: { maximumIterationCount },
    handoff: { handoffs },
    magentic: Object.fromEntries(
        Object.entries(magentic ?? {}).filter(([, value]) => value !== undefined && value !== "")
    ),
});

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
    options?: {
        workflowType?: string;
        managerAgentKey?: string;
    },
) => {
    const resolvedEntries = resolveSelectedAgentEntries(selectedValues, localAgents, remoteAgentModels);
    const managerIndex = options?.workflowType === "magentic"
        ? resolvedEntries.findIndex((entry) => entry.key === options.managerAgentKey)
        : -1;
    const entries = managerIndex > 0
        ? [
            resolvedEntries[managerIndex],
            ...resolvedEntries.slice(0, managerIndex),
            ...resolvedEntries.slice(managerIndex + 1),
        ]
        : resolvedEntries;
    const localRequestAgents = entries
        .filter((entry) => entry.kind === "local")
        .map((entry) => entry.localAgent!)
        .filter(Boolean);
    const selectedRemoteModels = entries.filter((entry) => entry.kind === "remote");
    const models = selectedRemoteModels.map((entry) => entry.backendId);
    const isMixedMagentic = options?.workflowType === "magentic"
        && localRequestAgents.length > 0
        && selectedRemoteModels.length > 0;
    const missingRemoteAgent = isMixedMagentic
        ? selectedRemoteModels.find((entry) => !entry.remoteAgentModel?.agent)
        : undefined;
    const requestError = missingRemoteAgent
        ? `Remote agent '${missingRemoteAgent.label}' does not expose the full agent configuration required for a mixed Magentic workflow.`
        : undefined;
    const requestAgents = isMixedMagentic && !requestError
        ? entries.map((entry) => entry.kind === "local"
            ? entry.localAgent
            : entry.remoteAgentModel?.agent
        ).filter((agent): agent is Agent => !!agent)
        : localRequestAgents;

    return {
        entries,
        localAgents: localRequestAgents,
        requestAgents: requestError ? [] : requestAgents,
        remoteAgentModels: entries
            .filter((entry) => entry.kind === "remote")
            .map((entry) => entry.remoteAgentModel!)
            .filter(Boolean),
        models: requestError || isMixedMagentic ? [] : models,
        error: requestError,
    };
};
