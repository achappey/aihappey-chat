import type { DecisionInput, DecisionQuestion, DecisionResponse } from "aihappey-ai";
import type { QuestionSet } from "./types";

export const MAX_DECISION_IMAGES = 128;
export const isInlineDecisionImage = (url: string) => /^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/]+=*$/i.test(url);

export function isValidDecisionQuestion(value: unknown): value is DecisionQuestion {
  if (!value || typeof value !== "object") return false;
  const q = value as DecisionQuestion;
  if (typeof q.instructions !== "string" || !q.instructions.trim()) return false;
  if (q.name !== undefined && typeof q.name !== "string") return false;
  if (q.type === "predicate") return true;
  if (q.type === "choice") {
    return Array.isArray(q.choices) && q.choices.length >= 2 && q.choices.every(c =>
      c && (typeof c.value === "boolean" || (typeof c.value === "string" && c.value.trim().length > 0))
      && (c.description === undefined || typeof c.description === "string"))
      && new Set(q.choices.map(c => JSON.stringify(c.value))).size === q.choices.length;
  }
  if (q.type === "score") {
    return Array.isArray(q.levels) && q.levels.length >= 2 && q.levels.every(l =>
      l && typeof l.label === "string" && l.label.trim().length > 0
      && (l.description === undefined || typeof l.description === "string"))
      && new Set(q.levels.map(l => l.label)).size === q.levels.length;
  }
  return false;
}

export function isValidDecisionInput(input: DecisionInput): boolean {
  if (typeof input === "string") return input.trim().length > 0;
  if (!Array.isArray(input) || input.length === 0) return false;
  let images = 0;
  let evidence = false;
  for (const message of input) {
    if (!message || message.role !== "user" || (message.type !== undefined && message.type !== "message")) return false;
    if (typeof message.content === "string") { evidence ||= !!message.content.trim(); continue; }
    if (!Array.isArray(message.content)) return false;
    for (const part of message.content) {
      if (part.type === "input_text" && typeof part.text === "string") evidence ||= !!part.text.trim();
      else if (part.type === "input_image" && typeof part.image_url === "string" && isInlineDecisionImage(part.image_url)
        && (part.detail == null || ["low", "high", "auto", "original"].includes(part.detail))) {
        images++; evidence = true;
      } else return false;
    }
  }
  return evidence && images <= MAX_DECISION_IMAGES;
}

/** Answers are associated by position, never by optional/non-unique name. */
export function isValidDecisionResponse(response: DecisionResponse, questions: DecisionQuestion[]): boolean {
  const probability = (n: number) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1;
  if (!response || typeof response.model !== "string" || !Array.isArray(response.answers)
    || response.answers.length !== questions.length || !response.usage) return false;
  return response.answers.every((a, index) => {
    if (!a || (a.name !== null && typeof a.name !== "string")) return false;
    if (a.type === "refusal") return true;
    const q = questions[index];
    if (a.type !== q.type) return false;
    if (a.type === "predicate") return probability(a.probability);
    if (!probability(a.confidence) || !Array.isArray(a.probabilities)) return false;
    if (a.type === "choice" && q.type === "choice") return q.choices.some(c => c.value === a.choice)
      && a.probabilities.every(p => probability(p.probability) && q.choices.some(c => c.value === p.value));
    if (a.type === "score" && q.type === "score") return Number.isFinite(a.score)
      && a.probabilities.every(p => probability(p.probability) && Number.isFinite(p.value) && q.levels.some(l => l.label === p.label));
    return false;
  });
}

export function serializeQuestionSet(set: QuestionSet): string {
  return JSON.stringify({ id: set.id, name: set.name, questions: set.questions }, null, 2);
}
