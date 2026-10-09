import type { UniversalDecisionState, UniversalDecisionQuestion, UniversalDecisionResponse, UniversalDecisionAnswer } from "aihappey-ai";

export type DecisionInput = UniversalDecisionState;
/** ID and optional display name are UI metadata, never part of the wire question. */
export type DecisionQuestion = UniversalDecisionQuestion & { id: string; name?: string };
export type DecisionResponse = UniversalDecisionResponse;
export type DecisionAnswer = UniversalDecisionAnswer;
export const decisionText = (value: unknown): string => typeof value === "string" ? value : value == null ? "" : JSON.stringify(value, null, 2);
export const newDecisionQuestion = (): DecisionQuestion => ({ id: crypto.randomUUID(), type: "boolean", instructions: "" });
export const toWireQuestions = (questions: DecisionQuestion[]) => Object.fromEntries(questions.map(({ id, name: _, ...question }) => [id, question]));

/** Ordered UI questions, serialized to a named question map at the provider boundary. */
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
