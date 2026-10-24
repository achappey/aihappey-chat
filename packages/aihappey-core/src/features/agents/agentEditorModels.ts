import { getAgentModels, getPrimaryAgentModel, type Agent, type AiModel, type ModelOption } from "aihappey-types";

/** Editor-only routing rules; storage and execution continue to use the model collection. */
export const getAgentEditorModels = (agent: Agent, catalog: ModelOption[] = []) => {
    const selected = getAgentModels(agent);
    const isDecision = (model: AiModel) =>
        (model.type ?? catalog.find(option => option.id === model.id && option.type === "language")?.type
            ?? catalog.find(option => option.id === model.id)?.type) === "decision";
    return {
        answers: selected.filter(model => !isDecision(model)),
        decisions: selected.filter(isDecision),
    };
};

export const hasValidAgentEditorModels = (agent: Agent, catalog: ModelOption[] = []) => {
    const { answers, decisions } = getAgentEditorModels(agent, catalog);
    return answers.length + decisions.length === 1 || (answers.length > 1 && decisions.length === 1);
};

export const setAgentEditorModels = (agent: Agent, configurations: AiModel[], catalog: ModelOption[] = []): Agent => {
    // Selection changes are explicit: never discard a router just because the answer count changed.
    // Resolve legacy untyped models using the catalog without rewriting their saved configuration.
    const { answers } = getAgentEditorModels({ ...agent, model: undefined, models: configurations }, catalog);
    return {
        ...agent,
        models: configurations,
        // Keep existing legacy documents compatible; collection-only documents stay collection-only.
        model: agent.model ? answers[0] ?? getPrimaryAgentModel({ models: configurations }) : undefined,
    };
};
