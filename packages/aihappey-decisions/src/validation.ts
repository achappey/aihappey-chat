import type { DecisionInput, DecisionQuestion, DecisionResponse, QuestionSet } from "./types";

export const MAX_DECISION_IMAGES = 128;
export const isInlineDecisionImage = (url: string) => /^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/]+=*$/i.test(url);
const object = (v: unknown): v is Record<string, any> => !!v && typeof v === "object" && !Array.isArray(v);
const content = (v: unknown): boolean => typeof v === "string" || object(v) || Array.isArray(v);
const probability = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1;

export function isValidDecisionQuestion(value: unknown): value is DecisionQuestion {
  if (!object(value) || typeof value.id !== "string" || !value.id.trim() || !content(value.instructions)
    || (typeof value.instructions === "string" && !value.instructions.trim())
    || (value.name !== undefined && typeof value.name !== "string")) return false;
  if (value.type === "boolean") return value.criteria === undefined || (object(value.criteria)
    && Object.entries(value.criteria).every(([key, v]) => ["true", "false"].includes(key) && (v === null || content(v))));
  if (value.type === "choice") return object(value.criteria) && Object.keys(value.criteria).length > 0
    && Object.entries(value.criteria).every(([key, v]) => !!key.trim() && (v === null || content(v)));
  if (value.type === "score") return Array.isArray(value.criteria) && value.criteria.length >= 2
    && value.criteria.every((v: unknown) => v === null || content(v));
  return false;
}

export const isValidDecisionQuestions = (questions: DecisionQuestion[]) => questions.length > 0
  && questions.every(isValidDecisionQuestion) && new Set(questions.map(q => q.id)).size === questions.length;

export function isValidDecisionInput(input: DecisionInput): boolean {
  if (typeof input === "string") return !!input.trim();
  if (!content(input)) return false;
  // Only inspect the recognized composer representation. Other JSON is shared evidence.
  if (!Array.isArray(input) || !input.some(m => object(m) && m.role === "user")) return true;
  let images = 0, evidence = false;
  for (const message of input) {
    if (!object(message) || message.role !== "user" || (message.type !== undefined && message.type !== "message")) return false;
    if (typeof message.content === "string") { evidence ||= !!message.content.trim(); continue; }
    if (!Array.isArray(message.content)) return false;
    for (const part of message.content) {
      if (!object(part)) return false;
      if (part.type === "input_text" && typeof part.text === "string") evidence ||= !!part.text.trim();
      else if (part.type === "input_image" && typeof part.image_url === "string" && isInlineDecisionImage(part.image_url)
        && (part.detail == null || ["low", "high", "auto", "original"].includes(part.detail))) { images++; evidence = true; }
      else return false;
    }
  }
  return evidence && images <= MAX_DECISION_IMAGES;
}

/** Exact ID coverage; tolerate only explicitly declared rounding, without changing numbers. */
export function isValidDecisionResponse(response: DecisionResponse, questions: DecisionQuestion[]): boolean {
  if (!object(response) || !object(response.answers) || !Array.isArray(response.warnings)
    || Object.keys(response.answers).length !== questions.length) return false;
  const rounding = response.rounding;
  if (rounding && Object.values(rounding).some(n => !Number.isInteger(n) || n < 0 || n > 100)) return false;
  const unit = (n?: number) => n === undefined ? 0 : 0.5 * 10 ** -n;
  return questions.every(q => {
    if (!Object.hasOwn(response.answers, q.id)) return false;
    const a = response.answers[q.id];
    if (!a || a.type === "refusal") return !!a;
    if (a.type !== q.type) return false;
    if (a.type === "boolean") return probability(a.probability);
    if (a.type === "choice" && q.type === "choice" && !Object.hasOwn(q.criteria, a.choice)) return false;
    if (a.type === "score" && q.type === "score" && (!Number.isFinite(a.score) || a.score < 0 || a.score > q.criteria.length - 1)) return false;
    if (a.type !== "choice" && a.type !== "score") return false;
    if (a.probabilities === undefined) return true;
    if (!object(a.probabilities)) return false;
    const keys = q.type === "choice" ? Object.keys(q.criteria) : q.type === "score" ? q.criteria.map((_, i) => String(i)) : [];
    if (Object.keys(a.probabilities).length !== keys.length || !keys.every(k => Object.hasOwn(a.probabilities!, k) && probability(a.probabilities![k]))) return false;
    const tolerance = 1e-6 + keys.length * unit(rounding?.probabilityDecimals);
    if (Math.abs(Object.values(a.probabilities).reduce((s, p) => s + p, 0) - 1) > tolerance) return false;
    if (a.type === "choice") return a.probabilities[a.choice] + 2 * unit(rounding?.probabilityDecimals) + 1e-6 >= Math.max(...Object.values(a.probabilities));
    const expected = keys.reduce((sum, key) => sum + Number(key) * a.probabilities![key], 0);
    return Math.abs(a.score - expected) <= 1e-6 + unit(rounding?.scoreDecimals) + keys.reduce((s, k) => s + Number(k) * unit(rounding?.probabilityDecimals), 0);
  });
}

export function serializeQuestionSet(set: QuestionSet): string {
  return JSON.stringify({ version: 2, id: set.id, name: set.name, questions: set.questions }, null, 2);
}
