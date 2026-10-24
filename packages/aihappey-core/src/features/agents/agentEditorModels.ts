import { getAgentModels, getPrimaryAgentModel, type Agent, type AiModel, type ModelOption } from "aihappey-types";

/** Editor-only routing rules; storage and execution continue to use the model collection. */
export const getAgentEditorModels = (agent: Agent, catalog: ModelOption[] = []) => {
    const selected = getAgentModels(agent);
    const isDecision = (model: AiModel) =>
        (model.type ?? catalog.find(option => option.id === model.id)?.type) === "decision";
    return {
        answers: selected.filter(model => !isDecision(model)),
        decisions: selected.filter(isDecision),
    };
};

export const hasValidAgentEditorModels = (agent: Agent, catalog: ModelOption[] = []) => {
    const { answers, decisions } = getAgentEditorModels(agent, catalog);
    return answers.length > 0 && decisions.length === (answers.length > 1 ? 1 : 0);
};

export const setAgentEditorModels = (agent: Agent, configurations: AiModel[], catalog: ModelOption[] = []): Agent => {
    // Do not let the old legacy field repopulate an explicitly emptied collection.
    const { answers, decisions } = getAgentEditorModels({ ...agent, model: undefined, models: configurations }, catalog);
    const models = answers.length > 1 ? configurations : answers;
    const typedModels = models.map(model => decisions.includes(model) && !model.type
        ? { ...model, type: "decision" } : model);
    return {
        ...agent,
        models: typedModels,
        // Keep existing legacy documents compatible; collection-only documents stay collection-only.
        model: agent.model ? getPrimaryAgentModel({ models: typedModels }) : undefined,
    };
};
