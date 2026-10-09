import { get, update } from "idb-keyval";
import type { DecisionInput, DecisionQuestion, DecisionResponse } from "../types";
import type { DecisionItem, DecisionsStore, QuestionSet, QuestionSetsStore } from "../types";
import { isValidDecisionInput, isValidDecisionQuestions, isValidDecisionResponse } from "../validation";
import { migrateDecisionItem, migrateQuestionSet } from "../migration";

const HISTORY_KEY = "aihappey_decisions_v2";
const SETS_KEY = "aihappey_question_sets_v2";

async function initialize<T>(key: string, legacyKey: string, convert: (value: unknown) => T | undefined): Promise<void> {
  const legacy = await get<unknown>(legacyKey);
  const migrated = Array.isArray(legacy) ? legacy.map(convert).filter((item): item is T => item !== undefined) : [];
  // Presence of the new array is the migration marker, including after every item was deleted.
  await update<T[]>(key, current => current ?? migrated);
}

/** Atomic read-modify-write avoids lost updates. Never cache uncommitted data or swallow storage errors. */
export class IndexedDBDecisionsStore implements DecisionsStore {
  private ready = () => initialize(HISTORY_KEY, "aihappey_decisions_v1", migrateDecisionItem);
  list = async (): Promise<DecisionItem[]> => { await this.ready(); return structuredClone((await get<DecisionItem[]>(HISTORY_KEY)) ?? []); };
  add = async (input: DecisionInput, questions: DecisionQuestion[], decision: DecisionResponse): Promise<DecisionItem> => {
    if (!isValidDecisionInput(input) || !isValidDecisionQuestions(questions) || !isValidDecisionResponse(decision, questions)) throw new Error("Invalid decision");
    await this.ready();
    const item = structuredClone({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), input, questions, decision });
    await update<DecisionItem[]>(HISTORY_KEY, current => [item, ...(current ?? [])]);
    return structuredClone(item);
  };
  delete = async (id: string) => { await this.ready(); await update<DecisionItem[]>(HISTORY_KEY, current => (current ?? []).filter(item => item.id !== id)); };
}

export class IndexedDBQuestionSetsStore implements QuestionSetsStore {
  private ready = () => initialize(SETS_KEY, "aihappey_question_sets_v1", migrateQuestionSet);
  list = async (): Promise<QuestionSet[]> => { await this.ready(); return structuredClone((await get<QuestionSet[]>(SETS_KEY)) ?? []); };
  save = async (values: Omit<QuestionSet, "id"> & { id?: string }): Promise<QuestionSet> => {
    if (!values.name.trim() || !isValidDecisionQuestions(values.questions)) {
      throw new Error("Invalid question set");
    }
    await this.ready();
    const item = structuredClone({ id: values.id ?? crypto.randomUUID(), name: values.name.trim(), questions: values.questions });
    await update<QuestionSet[]>(SETS_KEY, current => [item, ...(current ?? []).filter(set => set.id !== item.id)]);
    return structuredClone(item);
  };
  delete = async (id: string) => { await this.ready(); await update<QuestionSet[]>(SETS_KEY, current => (current ?? []).filter(set => set.id !== id)); };
}
