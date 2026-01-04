import React from "react";

/**
 * Provider-specific speech options card registry.
 *
 * If a provider has no extra options beyond the generic form,
 * leave it undefined so Card 2 stays hidden.
 */
export type ProviderSpeechOptionsFormProps = {
  providerKey: string;
  providerMetadata: any;
  setProviderMetadata: (next: any) => void;
};

export type ProviderSpeechOptionsRegistry = Partial<
  Record<string, React.FC<ProviderSpeechOptionsFormProps>>
>;

export const PROVIDER_SPEECH_OPTIONS_FORMS: ProviderSpeechOptionsRegistry = {
  // openai: undefined (no provider-specific options today)
};

