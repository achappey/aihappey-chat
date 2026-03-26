import { useCallback } from "react";
import { useTranslation } from "aihappey-i18n";

const STORAGE_QUOTA_FALLBACK =
  "Your browser storage is full. Remove some chats or other items and try again.";

export type StorageErrorMessageOptions = {
  quotaMessage?: string;
};

const safeJsonStringify = (value: unknown) => {
    try {
        return JSON.stringify(value);
    } catch {
        return "";
    }
};

export const isQuotaExceededError = (err: unknown) => {
  if (!err || typeof err !== "object") return false;

  const anyErr: any = err;
  const name = String(anyErr?.name ?? "");
  const message = String(anyErr?.message ?? "");

  return (
    name === "QuotaExceededError" ||
    anyErr?.code === 22 ||
    /quota.?exceeded|storage.+full|database.+full/i.test(`${name} ${message}`)
  );
};

const getQuotaMessage = (options?: StorageErrorMessageOptions) =>
  options?.quotaMessage?.trim() || STORAGE_QUOTA_FALLBACK;

export const getStorageErrorMessage = (
  err: unknown,
  fallback: string,
  options?: StorageErrorMessageOptions
) => {
  if (isQuotaExceededError(err)) return getQuotaMessage(options);
  if (typeof err === "string" && err.trim()) return err;

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

    const asJson = safeJsonStringify(anyErr);
    if (asJson) return asJson;
  }

  return fallback;
};

export function useStorageErrorMessage() {
  const { t } = useTranslation();

  return useCallback(
    (err: unknown, fallback: string) =>
      getStorageErrorMessage(err, fallback, {
        quotaMessage: t("storageQuotaMessage"),
      }),
    [t]
  );
}
