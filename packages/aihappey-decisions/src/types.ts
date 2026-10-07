import type { DecisionInput, DecisionQuestion, DecisionResponse } from "aihappey-ai";

/** Questions are the exact ordered OpenAI wire objects; metadata belongs only to the set. */
export interface QuestionSet {
  id: string;
  name: string;
  questions: DecisionQuestion[];
}

export interface DecisionItem {
  id: string;
  createdAt: string;
  input: DecisionInput;
  questions: DecisionQuestion[];
  decision: DecisionResponse;
}

export interface DecisionsStore {
  list(): Promise<DecisionItem[]>;
  add(input: DecisionInput, questions: DecisionQuestion[], decision: DecisionResponse): Promise<DecisionItem>;
  delete(id: string): Promise<void>;
}

export interface QuestionSetsStore {
  list(): Promise<QuestionSet[]>;
  save(values: Omit<QuestionSet, "id"> & { id?: string }): Promise<QuestionSet>;
  delete(id: string): Promise<void>;
}
