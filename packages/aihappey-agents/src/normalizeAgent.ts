import type { Agent } from "aihappey-types";

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getModelProviderKey = (modelId?: string) =>
  String(modelId ?? "").trim().split("/").filter(Boolean)[0]?.toLowerCase() ?? "";

const cleanHeaders = (value: unknown): Record<string, string> | undefined => {
  if (!isPlainRecord(value)) return undefined;

  const headers = Object.fromEntries(
    Object.entries(value)
      .map(([key, headerValue]) => [key.trim(), headerValue] as const)
      .filter(
        ([key, headerValue]) =>
          key.length > 0
          && headerValue != null
          && !isPlainRecord(headerValue)
          && !Array.isArray(headerValue)
          && String(headerValue).trim().length > 0
      )
      .map(([key, headerValue]) => [key, String(headerValue).trim()])
  );

  return Object.keys(headers).length > 0 ? headers : undefined;
};

/**
 * Returns the canonical, provider-unkeyed header map used by agent models.
 * Legacy agents stored this as `{ [providerKey]: headers }`; those records are
 * accepted here so they can be migrated when loaded or next saved.
 */
export const normalizeAgentProviderHeaders = (
  modelId?: string,
  value?: Record<string, unknown>
): Record<string, string> | undefined => {
  if (!isPlainRecord(value)) return undefined;

  const providerKey = getModelProviderKey(modelId);
  const legacyProviderHeaders = providerKey ? value[providerKey] : undefined;

  if (isPlainRecord(legacyProviderHeaders)) {
    return cleanHeaders(legacyProviderHeaders);
  }

  return cleanHeaders(value);
};

export const normalizeAgent = (agent: Agent): Agent => {
  const providerHeaders = normalizeAgentProviderHeaders(
    agent.model?.id,
    agent.model?.providerHeaders as unknown as Record<string, unknown> | undefined
  );

  return {
    ...agent,
    model: {
      ...agent.model,
      providerHeaders,
    },
  };
};
