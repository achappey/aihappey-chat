import { defaultProviderHeaders } from "./defaultProviderHeaders";

const ANTHROPIC_BETA_HEADER = "anthropic-beta";
const OPENAI_BETA_HEADER = "OpenAI-Beta";

const isPlainRecord = (value: unknown): value is Record<string, any> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const normalizeProviderHeaders = (
  providerHeaders?: Record<string, any>,
): Record<string, Record<string, string>> => {
  const normalized: Record<string, Record<string, string>> = {};

  for (const [rawProviderKey, rawHeaders] of Object.entries(providerHeaders ?? {})) {
    const providerKey = rawProviderKey.trim().toLowerCase();
    if (!providerKey || !isPlainRecord(rawHeaders)) continue;

    const headers = Object.fromEntries(
      Object.entries(rawHeaders)
        .map(([rawHeader, value]) => [rawHeader.trim(), value] as const)
        .filter(([header, value]) => header.length > 0 && value != null && String(value).trim().length > 0)
        .map(([header, value]) => [header, String(value)]),
    );

    if (Object.keys(headers).length) {
      normalized[providerKey] = headers;
    }
  }

  return normalized;
};

const normalizeMetadataHeaders = (value: unknown): Record<string, string> | undefined => {
  const [headers] = Object.values(normalizeProviderHeaders({ value }));
  return headers;
};

const addHeaderPatch = (
  providerHeaders: Record<string, Record<string, string>>,
  providerKey: string,
  headers?: Record<string, string>,
) => {
  if (!headers || !Object.keys(headers).length) return;

  providerHeaders[providerKey] = {
    ...(providerHeaders[providerKey] ?? {}),
    ...headers,
  };
};

const normalizeAnthropicBetaHeaderValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ).join(",");
  }

  const trimmed = String(value ?? "").trim();
  return trimmed || undefined;
};

export const splitLegacyProviderHeadersFromMetadata = ({
  providerMetadata,
  providerHeaders,
}: {
  providerMetadata?: Record<string, any>;
  providerHeaders?: Record<string, any>;
}) => {
  const nextProviderMetadata: Record<string, any> = {};
  const nextProviderHeaders: Record<string, Record<string, string>> = {
    ...defaultProviderHeaders,
    ...normalizeProviderHeaders(providerHeaders),
  };

  for (const [rawProviderKey, rawConfig] of Object.entries(providerMetadata ?? {})) {
    const providerKey = rawProviderKey.trim().toLowerCase();
    if (!providerKey || !isPlainRecord(rawConfig)) {
      nextProviderMetadata[rawProviderKey] = rawConfig;
      continue;
    }

    const { headers, [ANTHROPIC_BETA_HEADER]: anthropicBeta, [OPENAI_BETA_HEADER]: openAIBeta, ...bodyConfig } = rawConfig;
    addHeaderPatch(nextProviderHeaders, providerKey, normalizeMetadataHeaders(headers));

    if (providerKey === "anthropic") {
      const betaHeader = normalizeAnthropicBetaHeaderValue(anthropicBeta);
      if (betaHeader) {
        addHeaderPatch(nextProviderHeaders, providerKey, { [ANTHROPIC_BETA_HEADER]: betaHeader });
      }
    } else if (providerKey === "openai") {
      const betaHeader = normalizeAnthropicBetaHeaderValue(openAIBeta);
      if (betaHeader) {
        addHeaderPatch(nextProviderHeaders, providerKey, { [OPENAI_BETA_HEADER]: betaHeader });
      }
    } else if (anthropicBeta !== undefined) {
      bodyConfig[ANTHROPIC_BETA_HEADER] = anthropicBeta;
    }

    nextProviderMetadata[rawProviderKey] = bodyConfig;
  }

  return {
    providerMetadata: nextProviderMetadata,
    providerHeaders: normalizeProviderHeaders(nextProviderHeaders),
  };
};

export const getProviderHeadersForKey = (
  providerHeaders?: Record<string, any>,
  providerKey?: string,
): Record<string, string> | undefined => {
  if (!providerKey) return undefined;

  return normalizeProviderHeaders(providerHeaders)[providerKey.trim().toLowerCase()];
};

