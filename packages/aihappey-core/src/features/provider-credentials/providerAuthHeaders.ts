import { createHttpClient } from "aihappey-http";
import type { ModelResponse } from "aihappey-types";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import { enrichModelTypes } from "../models/modelTypeEnrichment";
import type { Provider } from "aihappey-types";

export type ModelsListProgress = {
  completed: number;
  total: number;
  active: boolean;
};

type ProviderLike = {
  name?: string;
};

const providerRegistryOrDefault = (providers?: Record<string, ProviderLike>) => providers ?? PROVIDERS;

const normalizeLookupValue = (value?: string) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const getProviderKeyFromModelId = (modelId?: string) =>
  String(modelId ?? "")
    .split("/")[0]
    ?.trim()
    .toLowerCase() || undefined;

const getProvider = (providerKey?: string, providers?: Record<string, ProviderLike>): ProviderLike | undefined => {
  if (!providerKey) return undefined;
  return providerRegistryOrDefault(providers)[providerKey];
};

export const getProviderApiKeyHeaderName = (providerKey?: string, providers?: Record<string, ProviderLike>) => {
  const provider = getProvider(providerKey, providers);
  if (!provider?.name) return undefined;
  return `X-${provider.name}-Key`;
};

export const isProviderHeader = (header: string, providerKey?: string, providers?: Record<string, ProviderLike>) => {
  if (!providerKey) return false;

  const provider = getProvider(providerKey, providers);
  const normalizedHeader = normalizeLookupValue(header);
  const normalizedProviderKey = normalizeLookupValue(providerKey);
  const normalizedProviderName = normalizeLookupValue(provider?.name);
  const normalizedCanonicalHeader = normalizeLookupValue(getProviderApiKeyHeaderName(providerKey, providers));

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

export const getEndpointHeaderEntries = (customHeaders?: Record<string, string>, providers?: Record<string, ProviderLike>) =>
  getConfiguredProviderHeaderEntries(customHeaders).filter(([header]) =>
    !Object.keys(providerRegistryOrDefault(providers)).some((providerKey) => isProviderHeader(header, providerKey, providers)),
  );

export const createEndpointHeaders = (customHeaders?: Record<string, string>, providers?: Record<string, ProviderLike>) =>
  Object.fromEntries(getEndpointHeaderEntries(customHeaders, providers));

export const getProviderApiKeyHeaderEntries = (
  customHeaders: Record<string, string> | undefined,
  providerKey?: string,
  providers?: Record<string, ProviderLike>,
) =>
  getConfiguredProviderHeaderEntries(customHeaders).filter(([header]) =>
    isProviderHeader(header, providerKey, providers),
  );

export const getProviderApiKeyHeaderEntry = (
  customHeaders: Record<string, string> | undefined,
  providerKey?: string,
  providers?: Record<string, ProviderLike>,
) => getProviderApiKeyHeaderEntries(customHeaders, providerKey, providers)[0];

export const createProviderBearerHeadersForProviderKey = (
  customHeaders: Record<string, string> | undefined,
  providerKey?: string,
  providers?: Record<string, ProviderLike>,
) => {
  const entry = getProviderApiKeyHeaderEntry(customHeaders, providerKey, providers);
  const value = entry?.[1]?.trim();

  if (!value) return {} as Record<string, string>;

  return {
    Authorization: value.toLowerCase().startsWith("bearer ")
      ? value
      : `Bearer ${value}`,
  };
};

export const createProviderBearerHeadersForModel = (
  customHeaders: Record<string, string> | undefined,
  modelId?: string,
  providers?: Record<string, ProviderLike>,
) => {
  const providerKey = getProviderKeyFromModelId(modelId);
  return createProviderBearerHeadersForProviderKey(customHeaders, providerKey, providers);
};

export const createChatAuthHeadersForModel = (
  customHeaders: Record<string, string> | undefined,
  modelId?: string,
  hasAccessToken?: boolean,
  providers?: Record<string, ProviderLike>,
) => hasAccessToken
  ? {}
  : {
    ...createProviderBearerHeadersForModel(customHeaders, modelId, providers),
    ...createEndpointHeaders(customHeaders, providers),
  };

export const createProviderHeaderSubsetForModel = (
  customHeaders: Record<string, string> | undefined,
  modelId?: string,
  providers?: Record<string, ProviderLike>,
) => {
  const providerKey = getProviderKeyFromModelId(modelId);
  return Object.fromEntries(getProviderApiKeyHeaderEntries(customHeaders, providerKey, providers));
};

const mergeModelResponses = (responses: ModelResponse[]) => {
  const seen = new Set<string>();
  const data = responses.flatMap((response) => response?.data ?? []).filter((model) => {
    if (!model?.id || seen.has(model.id)) return false;
    seen.add(model.id);
    return true;
  });

  return { data: enrichModelTypes(data) } satisfies ModelResponse;
};

const enrichModelResponse = (response: ModelResponse) => ({
  ...response,
  data: enrichModelTypes(response?.data ?? []),
}) satisfies ModelResponse;

const prefixProviderModelIds = (response: ModelResponse, providerKey?: string) => {
  const normalizedProviderKey = providerKey?.trim().toLowerCase();
  if (!normalizedProviderKey) return response;

  return {
    ...response,
    data: (response?.data ?? []).map((model) => ({
      ...model,
      id: model.id?.toLowerCase().startsWith(`${normalizedProviderKey}/`)
        ? model.id
        : `${normalizedProviderKey}/${model.id}`,
    })),
  } satisfies ModelResponse;
};

export const listModelsWithSplitProviderHeaders = async ({
  modelsApi,
  getAccessToken,
  customHeaders,
  providerKey,
  providers,
  onProgress,
}: {
  modelsApi: string;
  getAccessToken?: () => Promise<string>;
  customHeaders?: Record<string, string>;
  providerKey?: string;
  providers?: Record<string, Provider>;
  onProgress?: (progress: ModelsListProgress) => void;
}) => {
  if (getAccessToken) {
    const client = createHttpClient({ getAccessToken, headers: customHeaders });
    return enrichModelResponse(await client.get<ModelResponse>(modelsApi));
  }

  const providerHeaderEntries = providerKey
    ? getProviderApiKeyHeaderEntries(customHeaders, providerKey, providers)
    : getConfiguredProviderHeaderEntries(customHeaders);
  const includeAnonymousRequest = !providerKey;
  const total = providerKey ? 1 : (includeAnonymousRequest ? 1 : 0) + providerHeaderEntries.length;
  const responses: ModelResponse[] = [];
  let completed = 0;
  let lastError: unknown;

  const updateProgress = () => {
    onProgress?.({ completed, total, active: completed < total });
  };

  const requestModels = async (headers?: Record<string, string>) => {
    try {
      const client = createHttpClient({ headers });
      responses.push(prefixProviderModelIds(enrichModelResponse(await client.get<ModelResponse>(modelsApi)), providerKey));
    } catch (err) {
      lastError = err;
      console.error("Failed to load models for provider header subset:", err);
    } finally {
      completed += 1;
      updateProgress();
    }
  };

  updateProgress();

  if (includeAnonymousRequest) {
    await requestModels(undefined);
  }

  if (providerKey) {
    await requestModels(createProviderBearerHeadersForProviderKey(customHeaders, providerKey, providers));
  } else {
    for (const [header, value] of providerHeaderEntries) {
      await requestModels({ [header]: value });
    }
  }

  onProgress?.({ completed: total, total, active: false });

  if (responses.length === 0 && lastError) {
    throw lastError;
  }

  return mergeModelResponses(responses);
};
