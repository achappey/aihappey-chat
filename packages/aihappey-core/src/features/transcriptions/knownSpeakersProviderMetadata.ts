import type { FileStore } from "aihappey-files";
import {
  readStoredFileOrThrow,
  resolveKnownSpeakerReferenceDataUrls,
  type FileItem,
} from "aihappey-files";

/**
 * Hydrate OpenAI transcription provider options with `known_speaker_references`
 * (resolved from stored sample files by speaker name).
 *
 * Behavior: if any speaker sample is missing, returns `base` unchanged.
 */
export async function withOpenAiKnownSpeakerReferences<T extends Record<string, any>>(
  base: T | undefined,
  args: {
    items: FileItem[];
    files: FileStore;
    knownSpeakerNames: string[] | undefined;
  }
): Promise<T | undefined> {
  if (!base) return base;

  const knownSpeakerNames = args.knownSpeakerNames ?? [];
  if (!knownSpeakerNames.length) return base;

  // Only applies when openai bucket exists
  if (typeof (base as any).openai !== "object" || !(base as any).openai) return base;

  // If caller already provided references, do nothing.
  if ((base as any).openai.known_speaker_references) return base;

  const refs = await resolveKnownSpeakerReferenceDataUrls(
    args.items,
    knownSpeakerNames,
    (id: string) => readStoredFileOrThrow(args.files, id)
  );

  if (!refs) return base;

  return {
    ...(base as any),
    openai: {
      ...(base as any).openai,
      known_speaker_references: refs,
    },
  } as T;
}

