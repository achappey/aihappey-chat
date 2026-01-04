export type SpeechProviderConstraints = {
  /** If present, render a dropdown (provider default + these options). Otherwise keep free-text input. */
  voices?: string[];

  /** If present, restrict outputFormat to provider default + these values. Otherwise keep full list. */
  outputFormats?: string[];

  /** Override slider behavior for speed. */
  speed?: {
    min: number;
    max: number;
    step: number;
  };

  /** Hide the language field if false. */
  supportsLanguage?: boolean;

  /** Hide the instructions field if false. */
  supportsInstructions?: boolean;
};

/** Convenience type for maps keyed by providerKey (eg "openai"). */
export type SpeechProviderConstraintsMap = Record<string, SpeechProviderConstraints>;
