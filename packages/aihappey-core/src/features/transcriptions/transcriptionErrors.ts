import {
  getStorageErrorMessage,
  isQuotaExceededError,
  type StorageErrorMessageOptions,
} from "../storage/storageErrorMessage";

export const getTranscriptionErrorMessage = (
  err: unknown,
  options?: StorageErrorMessageOptions
) => {
  if (isQuotaExceededError(err)) {
    return getStorageErrorMessage(err, "Transcription failed", options);
  }

  if (typeof err === "string") return err;

  if (err && typeof err === "object") {
    const anyErr: any = err;

    if (typeof anyErr.message === "string" && anyErr.message.trim()) return anyErr.message;
    if (typeof anyErr.error === "string" && anyErr.error.trim()) return anyErr.error;

    const nestedArray =
      anyErr?.response?.error?.errors ??
      anyErr?.data?.error?.errors;

    if (Array.isArray(nestedArray)) {
      const first = nestedArray.find((x: any) => typeof x?.message === "string" && x.message.trim());
      if (first?.message) return first.message;
    }

    const nested =
      anyErr?.response?.error?.message ??
      anyErr?.response?.message ??
      anyErr?.data?.error?.message ??
      anyErr?.data?.message;

    if (typeof nested === "string" && nested.trim()) return nested;

    return getStorageErrorMessage(anyErr, "Transcription failed", options);
  }

  return "Transcription failed";
};

