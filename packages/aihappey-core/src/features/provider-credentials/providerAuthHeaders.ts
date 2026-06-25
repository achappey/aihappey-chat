import { createHttpClient } from "aihappey-http";
import type { ModelResponse } from "aihappey-types";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";

export type ModelsListProgress = {
  completed: number;
  total: number;
  active: boolean;
};

type ProviderLike = {
  name?: string;
};

const normalizeLookupValue = (value?: string) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const getProviderKeyFromModelId = (modelId?: string) =>
  String(modelId ?? "")
    .split("/")[0]
    ?.trim()
    .toLowerCase() || undefined;

const getProvider = (providerKey?: string): ProviderLike | undefined => {
  if (!providerKey) return undefined;
  return (PROVIDERS as Record<string, ProviderLike | undefined>)[providerKey];
};

const getCanonicalHeaderName = (providerKey?: string) => {
  const provider = getProvider(providerKey);
  if (!provider?.name) return undefined;
  return `X-${provider.name}-Key`;
};

export const isProviderHeader = (header: string, providerKey?: string) => {
  if (!providerKey) return false;

  const provider = getProvider(providerKey);
  const normalizedHeader = normalizeLookupValue(header);
  const normalizedProviderKey = normalizeLookupValue(providerKey);
  const normalizedProviderName = normalizeLookupValue(provider?.name);
  const normalizedCanonicalHeader = normalizeLookupValue(getCanonicalHeaderName(providerKey));

  if (normalizedCanonicalHeader && normalizedHeader === normalizedCanonicalHeader) {
    return true;
  }

  if (normalizedProviderName && normalizedHeader.includes(normalizedProviderName)) {
    return true;
  }

  return normalizedProviderKey.length >= 3 && normalizedHeader.includes(normalizedProviderKey);
};

const isNonEmptyHeader = ([, value]: [string, string]) =>
  value != null && String(value).trim().length > 0;

export const getConfiguredProviderHeaderEntries = (customHeaders?: Record<string, string>) =>
  Object.entries(customHeaders ?? {}).filter(isNonEmptyHeader);

export const getEndpointHeaderEntries = (customHeaders?: Record<string, string>) =>
  getConfiguredProviderHeaderEntries(customHeaders).filter(([header]) =>
    !Object.keys(PROVIDERS).some((providerKey) => isProviderHeader(header, providerKey)),
  );

export const createEndpointHeaders = (customHeaders?: Record<string, string>) =>
  Object.fromEntries(getEndpointHeaderEntries(customHeaders));

export const getProviderApiKeyHeaderEntries = (
  customHeaders: Record<string, string> | undefined,
  providerKey?: string,
) =>
  getConfiguredProviderHeaderEntries(customHeaders).filter(([header]) =>
    isProviderHeader(header, providerKey),
  );

export const getProviderApiKeyHeaderEntry = (
  customHeaders: Record<string, string> | undefined,
  providerKey?: string,
) => getProviderApiKeyHeaderEntries(customHeaders, providerKey)[0];

export const createProviderBearerHeadersForModel = (
  customHeaders: Record<string, string> | undefined,
  modelId?: string,
) => {
  const providerKey = getProviderKeyFromModelId(modelId);
  const entry = getProviderApiKeyHeaderEntry(customHeaders, providerKey);
  const value = entry?.[1]?.trim();

  if (!value) return {} as Record<string, string>;

  return {
    Authorization: value.toLowerCase().startsWith("bearer ")
      ? value
      : `Bearer ${value}`,
  };
};

export const createChatAuthHeadersForModel = (
  customHeaders: Record<string, string> | undefined,
  modelId?: string,
  hasAccessToken?: boolean,
) => hasAccessToken
  ? {}
  : {
    ...createProviderBearerHeadersForModel(customHeaders, modelId),
    ...createEndpointHeaders(customHeaders),
  };

export const createProviderHeaderSubsetForModel = (
  customHeaders: Record<string, string> | undefined,
  modelId?: string,
) => {
  const providerKey = getProviderKeyFromModelId(modelId);
  return Object.fromEntries(getProviderApiKeyHeaderEntries(customHeaders, providerKey));
};

const mergeModelResponses = (responses: ModelResponse[]) => {
  const seen = new Set<string>();
  const data = responses.flatMap((response) => response?.data ?? []).filter((model) => {
    if (!model?.id || seen.has(model.id)) return false;
    seen.add(model.id);
    return true;
  });

  return { data } satisfies ModelResponse;
};

export const listModelsWithSplitProviderHeaders = async ({
  modelsApi,
  getAccessToken,
  customHeaders,
  onProgress,
}: {
  modelsApi: string;
  getAccessToken?: () => Promise<string>;
  customHeaders?: Record<string, string>;
  onProgress?: (progress: ModelsListProgress) => void;
}) => {
  if (getAccessToken) {
    const client = createHttpClient({ getAccessToken, headers: customHeaders });
    return client.get<ModelResponse>(modelsApi);
  }

  const providerHeaderEntries = getConfiguredProviderHeaderEntries(customHeaders);
  const total = 1 + providerHeaderEntries.length;
  const responses: ModelResponse[] = [];
  let completed = 0;
  let lastError: unknown;

  const updateProgress = () => {
    onProgress?.({ completed, total, active: completed < total });
  };

  const requestModels = async (headers?: Record<string, string>) => {
    try {
      const client = createHttpClient({ headers });
      responses.push(await client.get<ModelResponse>(modelsApi));
    } catch (err) {
      lastError = err;
      console.error("Failed to load models for provider header subset:", err);
    } finally {
      completed += 1;
      updateProgress();
    }
  };

  updateProgress();
  await requestModels(undefined);

  for (const [header, value] of providerHeaderEntries) {
    await requestModels({ [header]: value });
  }

  onProgress?.({ completed: total, total, active: false });

  if (responses.length === 0 && lastError) {
    throw lastError;
  }

  return mergeModelResponses(responses);
};
