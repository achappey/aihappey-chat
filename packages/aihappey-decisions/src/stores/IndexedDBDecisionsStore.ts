import { get, update } from "idb-keyval";
import type { DecisionInput, DecisionQuestion, DecisionResponse } from "aihappey-ai";
import type { DecisionItem, DecisionsStore, QuestionSet, QuestionSetsStore } from "../types";
import { isValidDecisionQuestion } from "../validation";

const HISTORY_KEY = "aihappey_decisions_v1";
const SETS_KEY = "aihappey_question_sets_v1";

/** Atomic read-modify-write avoids lost updates. Never cache uncommitted data or swallow storage errors. */
export class IndexedDBDecisionsStore implements DecisionsStore {
  list = async (): Promise<DecisionItem[]> => structuredClone((await get<DecisionItem[]>(HISTORY_KEY)) ?? []);
  add = async (input: DecisionInput, questions: DecisionQuestion[], decision: DecisionResponse): Promise<DecisionItem> => {
    const item = structuredClone({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), input, questions, decision });
    await update<DecisionItem[]>(HISTORY_KEY, current => [item, ...(current ?? [])]);
    return structuredClone(item);
  };
  delete = async (id: string) => { await update<DecisionItem[]>(HISTORY_KEY, current => (current ?? []).filter(item => item.id !== id)); };
}

export class IndexedDBQuestionSetsStore implements QuestionSetsStore {
  list = async (): Promise<QuestionSet[]> => structuredClone((await get<QuestionSet[]>(SETS_KEY)) ?? []);
  save = async (values: Omit<QuestionSet, "id"> & { id?: string }): Promise<QuestionSet> => {
    if (!values.name.trim() || !values.questions.length || !values.questions.every(isValidDecisionQuestion)) {
      throw new Error("Invalid question set");
    }
    const item = structuredClone({ id: values.id ?? crypto.randomUUID(), name: values.name.trim(), questions: values.questions });
    await update<QuestionSet[]>(SETS_KEY, current => [item, ...(current ?? []).filter(set => set.id !== item.id)]);
    return structuredClone(item);
  };
  delete = async (id: string) => { await update<QuestionSet[]>(SETS_KEY, current => (current ?? []).filter(set => set.id !== id)); };
}
