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
