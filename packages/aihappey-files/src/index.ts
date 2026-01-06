export { FilesProvider, useFiles, FilesContextType} from "./FilesProvider";
export type { FileStore, StoredFile, FileItem } from "./types";

export {
  KNOWN_SPEAKER_REFERENCE_PREFIX,
  sanitizeKnownSpeakerName,
  knownSpeakerReferenceNamePrefix,
  knownSpeakerReferenceFilename,
  extFromFilename,
  listKnownSpeakerReferenceItems,
  readStoredFileOrThrow,
  getLatestKnownSpeakerReferenceItem,
  resolveKnownSpeakerReferenceDataUrls,
  deleteKnownSpeakerReferenceSamples,
  saveKnownSpeakerReferenceSample,
  migrateKnownSpeakerReferenceSample,
  blobToDataUrl,
} from "./knownSpeakers";

