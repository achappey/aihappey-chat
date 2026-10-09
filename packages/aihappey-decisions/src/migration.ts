import type { DecisionItem, DecisionQuestion, DecisionResponse, DecisionAnswer, QuestionSet } from "./types";
import { isValidDecisionInput, isValidDecisionQuestions, isValidDecisionResponse } from "./validation";

/** Intentionally bounded: ambiguous typed choices remain in the untouched v1 store. */
export function migrateQuestions(values: unknown): DecisionQuestion[] | undefined {
  if (!Array.isArray(values)) return;
  try {
    const questions: DecisionQuestion[] = values.map((q, i) => {
      const common = { id: `question-${i + 1}`, ...(typeof q.name === "string" ? { name: q.name } : {}), instructions: q.instructions };
      if (q.type === "predicate") return { ...common, type: "boolean" };
      if (q.type === "choice" && Array.isArray(q.choices) && q.choices.every((c: any) => typeof c.value === "string")
        && new Set(q.choices.map((c: any) => c.value)).size === q.choices.length) {
        return { ...common, type: "choice", criteria: Object.fromEntries(q.choices.map((c: any) => [c.value, c.description ?? null])) };
      }
      if (q.type === "score" && Array.isArray(q.levels)) return { ...common, type: "score",
        criteria: q.levels.map((l: any) => l.description ? `${l.label}: ${l.description}` : l.label) };
      throw new Error("Not safely convertible");
    });
    return isValidDecisionQuestions(questions) ? questions : undefined;
  } catch { return; }
}

export function migrateQuestionSet(value: any): QuestionSet | undefined {
  const questions = migrateQuestions(value?.questions);
  if (questions && typeof value.id === "string" && typeof value.name === "string" && value.name.trim())
    return { id: value.id, name: value.name, questions };
}

export function migrateDecisionItem(value: any): DecisionItem | undefined {
  try {
    const questions = migrateQuestions(value?.questions);
    const native = value?.decision;
    if (!questions || !isValidDecisionInput(value.input) || typeof value.id !== "string" || typeof value.createdAt !== "string"
      || typeof native?.model !== "string" || !Array.isArray(native.answers) || native.answers.length !== questions.length) return;
    const answers = Object.fromEntries(questions.map((q, i): [string, DecisionAnswer] => {
      const a = native.answers[i];
      if (a.type === "refusal") return [q.id, { type: "refusal" }];
      if (q.type === "boolean" && a.type === "predicate") return [q.id, { type: "boolean", probability: a.probability }];
      if (q.type === "choice" && a.type === "choice") return [q.id, { type: "choice", choice: a.choice,
        probabilities: Object.fromEntries(a.probabilities.map((p: any) => [p.value, p.probability])) }];
      if (q.type === "score" && a.type === "score") {
        const levels = value.questions[i].levels;
        if (a.probabilities.length !== levels.length || new Set(a.probabilities.map((p: any) => p.label)).size !== levels.length) throw new Error("Invalid levels");
        const probabilities = Object.fromEntries(levels.map((l: any, index: number) => {
          const p = a.probabilities.find((p: any) => p.label === l.label);
          if (!p) throw new Error("Missing level");
          return [String(index), p.probability];
        }));
        return [q.id, { type: "score", probabilities, score: Object.entries(probabilities).reduce((s, [k, p]) => s + Number(k) * Number(p), 0) }];
      }
      throw new Error("Incompatible answer");
    }));
    const decision: DecisionResponse = { answers, warnings: [],
      usage: { inputTokens: native.usage?.input_tokens, outputTokens: native.usage?.output_tokens },
      providerMetadata: { [native.model.split("/")[0].toLowerCase()]: structuredClone(native) },
      response: { modelId: native.model, body: structuredClone(native) } };
    if (isValidDecisionResponse(decision, questions)) return { id: value.id, createdAt: value.createdAt, input: structuredClone(value.input), questions, decision };
  } catch { /* Unsupported records stay available in the original store. */ }
}
