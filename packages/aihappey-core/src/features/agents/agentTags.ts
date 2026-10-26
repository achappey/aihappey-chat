import type { Agent, RemoteAgentModel } from "aihappey-types";

export const getAgentTags = (...sources: ({ tags?: string[] } | undefined)[]): string[] =>
    Array.from(new Set(sources.flatMap((source) =>
        Array.isArray(source?.tags)
            ? source.tags.filter((tag) => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean)
            : []
    )));

export const collectAgentTags = (agents: Agent[], remoteAgentModels: RemoteAgentModel[]): string[] =>
    getAgentTags(...agents, ...remoteAgentModels, ...remoteAgentModels.map((model) => model.agent))
        .sort((a, b) => a.localeCompare(b));

export const getAgentOwner = (...sources: ({ owned_by?: string } | undefined)[]): string =>
    sources.map((source) => typeof source?.owned_by === "string" ? source.owned_by.trim() : "")
        .find(Boolean) ?? "";

export const collectAgentOwners = (agents: Agent[], remoteAgentModels: RemoteAgentModel[]): string[] =>
    Array.from(new Set([...agents, ...remoteAgentModels, ...remoteAgentModels.map((model) => model.agent)]
        .map((source) => getAgentOwner(source)).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b));

export const getAgentGroups = (...sources: ({ tags?: string[]; owned_by?: string } | undefined)[]): string[] => {
    const tags = getAgentTags(...sources);
    const owner = getAgentOwner(...sources);
    return tags.length ? tags : owner ? [owner] : [];
};

export const matchesAgentMetadata = (agent: Agent, tags: string[], owners: string[]): boolean =>
    (!tags.length || getAgentTags(agent).some((tag) => tags.includes(tag)))
    && (!owners.length || owners.includes(getAgentOwner(agent)));

export const getAgentMetadataTabKey = (facet: "tag" | "owner", value: string): string => `${facet}:${value}`;

export const matchesAgentMetadataTab = (agent: Agent, key: string): boolean =>
    key.startsWith("tag:") ? getAgentTags(agent).includes(key.slice(4))
        : key.startsWith("owner:") ? getAgentOwner(agent) === key.slice(6) : true;
