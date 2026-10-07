/** OpenAI-compatible Decisions wire types. Deliberately separate from the SDK model types. */
export type DecisionQuestion =
  | { type: "predicate"; name?: string; instructions: string }
  | { type: "choice"; name?: string; instructions: string; choices: { value: string | boolean; description?: string }[] }
  | { type: "score"; name?: string; instructions: string; levels: { label: string; description?: string }[] };

export type DecisionInputPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail?: "low" | "high" | "auto" | "original" | null };

export type DecisionInput = string | { role: "user"; type?: "message"; content: string | DecisionInputPart[] }[];

export type DecisionAnswer =
  | { type: "predicate"; name: string | null; probability: number }
  | { type: "choice"; name: string | null; choice: string | boolean; confidence: number; probabilities: { value: string | boolean; probability: number }[] }
  | { type: "score"; name: string | null; score: number; confidence: number; probabilities: { label: string; value: number; probability: number }[] }
  | { type: "refusal"; name: string | null };

export interface DecisionRequest {
  model: string;
  input: DecisionInput;
  questions: DecisionQuestion[];
  safety_identifier?: string | null;
}

export interface DecisionResponse {
  model: string;
  answers: DecisionAnswer[];
  usage: {
    input_tokens: number;
    input_tokens_details: { cache_write_tokens: number; cached_tokens: number };
    output_tokens: number;
    output_tokens_details: { reasoning_tokens: number };
    total_tokens: number;
  };
}

export function createOpenAIDecisionProvider(config: {
  baseUrl: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}) {
  return {
    async create(request: DecisionRequest, signal?: AbortSignal): Promise<DecisionResponse> {
      const response = await (config.fetch ?? fetch)(config.baseUrl, {
        method: "POST",
        headers: { ...config.headers, "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal,
      });
      if (!response.ok) {
        throw new Error(`Decisions API failed (${response.status} ${await response.text()})`);
      }
      return response.json();
    },
  };
}
