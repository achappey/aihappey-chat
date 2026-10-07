import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { DecisionInput, DecisionQuestion, DecisionResponse } from "aihappey-ai";
import type { DecisionItem, DecisionsStore, QuestionSet, QuestionSetsStore } from "./types";
import { IndexedDBDecisionsStore, IndexedDBQuestionSetsStore } from "./stores/IndexedDBDecisionsStore";

export const indexedDbDecisionsStore = new IndexedDBDecisionsStore();
export const indexedDbQuestionSetsStore = new IndexedDBQuestionSetsStore();

const DecisionsContext = createContext<{
  items: DecisionItem[];
  questionSets: QuestionSet[];
  error: unknown;
  clearError(): void;
  refresh(): Promise<void>;
  add(input: DecisionInput, questions: DecisionQuestion[], response: DecisionResponse): Promise<DecisionItem>;
  delete(id: string): Promise<void>;
  saveQuestionSet(values: Omit<QuestionSet, "id"> & { id?: string }): Promise<QuestionSet>;
  deleteQuestionSet(id: string): Promise<void>;
} | null>(null);

export function DecisionsProvider({ children, store = indexedDbDecisionsStore, questionSetsStore = indexedDbQuestionSetsStore }: {
  children: ReactNode; store?: DecisionsStore; questionSetsStore?: QuestionSetsStore;
}) {
  const [items, setItems] = useState<DecisionItem[]>([]);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [error, setError] = useState<unknown>();
  const refresh = useCallback(async () => {
    const [history, sets] = await Promise.all([store.list(), questionSetsStore.list()]);
    setItems(history); setQuestionSets(sets);
  }, [store, questionSetsStore]);
  useEffect(() => {
    let active = true;
    Promise.all([store.list(), questionSetsStore.list()]).then(([history, sets]) => {
      if (active) { setItems(history); setQuestionSets(sets); }
    }).catch(err => { if (active) setError(err); });
    return () => { active = false; };
  }, [store, questionSetsStore]);
  const value = useMemo(() => ({
    items, questionSets, error, clearError: () => setError(undefined), refresh,
    add: async (input: DecisionInput, questions: DecisionQuestion[], response: DecisionResponse) => {
      const item = await store.add(input, questions, response);
      setItems(current => [item, ...current.filter(i => i.id !== item.id)]); return item;
    },
    delete: async (id: string) => { await store.delete(id); setItems(current => current.filter(i => i.id !== id)); },
    saveQuestionSet: async (values: Omit<QuestionSet, "id"> & { id?: string }) => {
      const set = await questionSetsStore.save(values);
      setQuestionSets(current => [set, ...current.filter(s => s.id !== set.id)]); return set;
    },
    deleteQuestionSet: async (id: string) => { await questionSetsStore.delete(id); setQuestionSets(current => current.filter(s => s.id !== id)); },
  }), [items, questionSets, error, refresh, store, questionSetsStore]);
  return <DecisionsContext.Provider value={value}>{children}</DecisionsContext.Provider>;
}

export function useDecisions() {
  const context = useContext(DecisionsContext);
  if (!context) throw new Error("useDecisions must be used within DecisionsProvider");
  return context;
}
