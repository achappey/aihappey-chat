import { useMemo } from "react";
import { useAppStore } from "aihappey-state";
import type { ModelOption } from "aihappey-types";

type ModelType = ModelOption["type"] | "chat";

/**
 * Returns provider metadata/options for the CURRENTLY selected model, taking the model's
 * type into account.
 *
 * Backend contract (confirmed): we always send this under `body.providerMetadata`.
 *
 * Mapping:
 * - language/chat models  -> chatSlice.providerMetadata
 * - image models          -> imageSlice.providerImageMetadata
 * - speech models         -> speechSlice.providerSpeechMetadata
 * - transcription models  -> transcriptionSlice.providerTranscriptionMetadata
 *
 * Output shape matches the existing chat contract: `{ [providerKey]: providerOptions }`
 * filtered to the providerKey derived from `selectedModel` (e.g. `openai/...` -> `openai`).
 */
export function useProviderMetadataForSelectedModelType<
  T extends Record<string, any> = Record<string, any>,
>() {
  const selectedModel = useAppStore((s) => s.selectedModel);
  const models = useAppStore((s) => s.models);

  // Per-model-type metadata buckets
  const providerMetadata = useAppStore((s) => s.providerMetadata);
  const providerImageMetadata = useAppStore((s) => s.providerImageMetadata);
  const providerSpeechMetadata = useAppStore((s) => s.providerSpeechMetadata);
  const providerTranscriptionMetadata = useAppStore((s) => s.providerTranscriptionMetadata);

  const modelType: ModelType | undefined = useMemo(() => {
    if (!selectedModel) return undefined;
    return models?.find((m) => m.id === selectedModel)?.type as ModelType | undefined;
  }, [models, selectedModel]);

  return useMemo<T | undefined>(() => {
    if (!selectedModel) return undefined;

    // Keep existing providerKey semantics: `openai/gpt-4o` -> `openai`
    const providerKey = selectedModel.split("/")[0];
    if (!providerKey) return undefined;

    // Default to chat metadata when model type is unknown (safe fallback).
    const bucket = (() => {
      switch (modelType) {
        case "image":
          return providerImageMetadata;
        case "speech":
          return providerSpeechMetadata;
        case "transcription":
          return providerTranscriptionMetadata;
        case "language":
        case "chat":
        default:
          return providerMetadata;
      }
    })();

    if (!bucket) return undefined;
    const value = bucket[providerKey];
    if (value === undefined) return undefined;

    return { [providerKey]: value } as T;
  }, [
    modelType,
    providerImageMetadata,
    providerSpeechMetadata,
    providerTranscriptionMetadata,
    providerMetadata,
    selectedModel,
  ]);
}

