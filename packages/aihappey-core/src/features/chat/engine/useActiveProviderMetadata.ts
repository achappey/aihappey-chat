import { useEffect, useState } from "react";
import { useAppStore } from "aihappey-state";
import { useFiles } from "aihappey-files";
import type { ModelOption } from "aihappey-types";
import { useProviderMetadataForSelectedModelType } from "./useProviderMetadataForSelectedModelType";
import { withOpenAiKnownSpeakerReferences } from "../../transcriptions/knownSpeakersProviderMetadata";

type ModelType = ModelOption["type"] | "chat";

/**
 * Backwards-compatible alias.
 *
 * Historically this only used `chatSlice.providerMetadata`.
 * It now delegates to [`useProviderMetadataForSelectedModelType()`](packages/aihappey-core/src/features/chat/engine/useProviderMetadataForSelectedModelType.ts:1)
 * so chat-with-image/speech/transcription models send the correct provider options.
 */
export function useActiveProviderMetadata<
  T extends Record<string, any> = Record<string, any>,
>() {
  const base = useProviderMetadataForSelectedModelType<T>();

  const selectedModel = useAppStore((s) => s.selectedModel);
  const models = useAppStore((s) => s.models);
  const files = useFiles();

  const [hydrated, setHydrated] = useState<T | undefined>(base);

  // Determine selected model type (mirrors `useProviderMetadataForSelectedModelType()`)
  const modelType: ModelType | undefined = (() => {
    if (!selectedModel) return undefined;
    return models?.find((m) => m.id === selectedModel)?.type as ModelType | undefined;
  })();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Default: passthrough
      let next: T | undefined = base;

      // Only hydrate for OpenAI transcription models.
      if (
        base &&
        modelType === "transcription" &&
        selectedModel?.startsWith("openai/")
      ) {
        const names: string[] | undefined = (base as any)?.openai?.known_speaker_names;

        next = (await withOpenAiKnownSpeakerReferences(base, {
          items: files.items,
          files,
          knownSpeakerNames: names,
        })) as T | undefined;
      }

      if (!cancelled) setHydrated(next);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [base, files, files.items, modelType, selectedModel]);

  return hydrated;
}
