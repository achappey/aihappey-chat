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
