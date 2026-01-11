const safeJsonStringify = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
};

export const getRerankingErrorMessage = (err: unknown) => {
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

    const asJson = safeJsonStringify(anyErr);
    if (asJson) return asJson;
  }

  return "Reranking failed";
};

