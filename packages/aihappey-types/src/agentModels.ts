import type { Agent, AiModel } from "./agents";

/** Stable order matters: the first answer model is the deterministic fallback. */
export const getAgentModels = (agent?: Pick<Agent, "model" | "models">): AiModel[] => {
  const unique = (models: AiModel[]) => {
    const seen = new Set<string>();
    return models.filter(model => model?.id?.trim() && !seen.has(model.id) && !!seen.add(model.id));
  };
  const models = unique(agent?.models ?? []);
  return models.length ? models : unique(agent?.model ? [agent.model] : []);
};

/** The legacy configuration may still be used as a fallback and needs its credentials too. */
export const getAgentCredentialModels = (agent?: Pick<Agent, "model" | "models">): AiModel[] =>
  [...getAgentModels(agent), ...(agent?.model?.id ? [agent.model] : [])];

export const getPrimaryAgentModel = (agent?: Pick<Agent, "model" | "models">): AiModel | undefined =>
  getAgentModels(agent).find(model => model.type !== "decision") ?? agent?.model;
