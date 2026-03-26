import {
  getStorageErrorMessage,
  isQuotaExceededError,
  type StorageErrorMessageOptions,
} from "../storage/storageErrorMessage";

export const getRerankingErrorMessage = (
  err: unknown,
  options?: StorageErrorMessageOptions
) => {
  if (isQuotaExceededError(err)) {
    return getStorageErrorMessage(err, "Reranking failed", options);
  }

  if (typeof err === "string") return err;

  if (err && typeof err === "object") {
    const anyErr: any = err;

    if (typeof anyErr.message === "string" && anyErr.message.trim()) return anyErr.message;
    if (typeof anyErr.error === "string" && anyErr.error.trim()) return anyErr.error;

    const nested =
      anyErr?.response?.error?.message ??
      anyErr?.response?.message ??
      anyErr?.data?.error?.message ??
      anyErr?.data?.message;
    if (typeof nested === "string" && nested.trim()) return nested;

    return getStorageErrorMessage(anyErr, "Reranking failed", options);
  }

  return "Reranking failed";
};

