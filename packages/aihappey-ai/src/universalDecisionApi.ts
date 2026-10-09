import type {
  Experimental_DecisionModelV4CallOptions,
  Experimental_DecisionModelV4Result,
} from "@ai-sdk/provider";

/** Universal wire types, separate from the public OpenAI-compatible API. */
export type UniversalDecisionJSON = string | number | boolean | null | { readonly [key: string]: UniversalDecisionJSON } | readonly UniversalDecisionJSON[];
/** Gateway shared JSON state; the experimental SDK now also has a parts-only state API. */
export type UniversalDecisionState = string | { readonly [key: string]: UniversalDecisionJSON } | readonly UniversalDecisionJSON[];
export type UniversalDecisionQuestion = Experimental_DecisionModelV4CallOptions["questions"][string];
export type UniversalDecisionAnswer = Experimental_DecisionModelV4Result["answers"][string];
export type UniversalDecisionResponse = Experimental_DecisionModelV4Result;
