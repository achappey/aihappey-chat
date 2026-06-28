import { createHttpClient } from "aihappey-http";
import type { ModelResponse } from "aihappey-types";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import { enrichModelTypes } from "../models/modelTypeEnrichment";
import type { Provider } from "aihappey-types";
import { HIDDEN_DIRECT_MODEL_ID_SUFFIX } from "aihappey-types";

export const DIRECT_MODEL_ID_SUFFIX = HIDDEN_DIRECT_MODEL_ID_SUFFIX;

export type ModelsListProgress = {
  completed: number;
  total: number;
  active: boolean;
};

type ProviderLike = {
  name?: string;
  apiBaseUrl?: string;
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
) => {
  const entries = getProviderApiKeyHeaderEntries(customHeaders, providerKey, providers);
  const canonicalHeader = normalizeLookupValue(getProviderApiKeyHeaderName(providerKey, providers));

  return entries.find(([header]) => canonicalHeader && normalizeLookupValue(header) === canonicalHeader)
    ?? entries[0];
};

export const getExactProviderApiKeyHeaderEntry = (
  customHeaders: Record<string, string> | undefined,
  providerKey?: string,
  providers?: Record<string, ProviderLike>,
) => {
  const canonicalHeader = normalizeLookupValue(getProviderApiKeyHeaderName(providerKey, providers));
  if (!canonicalHeader) return undefined;

  return getConfiguredProviderHeaderEntries(customHeaders).find(([header]) =>
    normalizeLookupValue(header) === canonicalHeader,
  );
};

const getProviderModelApi = (provider: ProviderLike | undefined, modelsApi: string) => {
  const baseUrl = provider?.apiBaseUrl?.trim();
  if (!baseUrl) return modelsApi;

  return `${baseUrl.replace(/\/$/, "")}/v1/models`;
};

const getDirectProviderModelRequests = (
  customHeaders: Record<string, string> | undefined,
  providers?: Record<string, ProviderLike>,
) => Object.entries(providerRegistryOrDefault(providers)).flatMap(([providerKey, provider]) => {
  if (!provider?.apiBaseUrl?.trim()) return [];

  const entry = getExactProviderApiKeyHeaderEntry(customHeaders, providerKey, providers);
  const value = entry?.[1]?.trim();
  if (!value) return [];

  return [{ providerKey, apiKey: value }];
});

const createBearerHeadersFromApiKey = (value?: string) => {
  const apiKey = value?.trim();

  if (!apiKey) return {} as Record<string, string>;

  return {
    Authorization: apiKey.toLowerCase().startsWith("bearer ")
      ? apiKey
      : `Bearer ${apiKey}`,
  };
};

export const createProviderBearerHeadersForProviderKey = (
  customHeaders: Record<string, string> | undefined,
  providerKey?: string,
  providers?: Record<string, ProviderLike>,
) => {
  const entry = getExactProviderApiKeyHeaderEntry(customHeaders, providerKey, providers);
  const value = entry?.[1]?.trim();

  return createBearerHeadersFromApiKey(value);
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
    ...createProviderHeaderSubsetForModel(customHeaders, modelId, providers),
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

const modelRouteOf = (model: any): "gateway" | "direct" =>
  model?.route === "direct" ? "direct" : "gateway";

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

const annotateGatewayModelIds = (response: ModelResponse) => ({
  ...response,
  data: (response?.data ?? []).map((model) => {
    const providerKey = getProviderKeyFromModelId(model.id);

    return {
      ...model,
      route: modelRouteOf(model),
      providerKey: (model as any).providerKey ?? providerKey,
      providerModelId: (model as any).providerModelId ?? model.id,
    };
  }),
}) satisfies ModelResponse;

const prefixProviderModelIds = (response: ModelResponse, providerKey?: string) => {
  const normalizedProviderKey = providerKey?.trim().toLowerCase();
  if (!normalizedProviderKey) return response;

  return {
    ...response,
    data: (response?.data ?? []).map((model) => {
      const providerModelId = model.id;
      const displayId = providerModelId?.toLowerCase().startsWith(`${normalizedProviderKey}/`)
        ? providerModelId
        : `${normalizedProviderKey}/${providerModelId}`;

      return {
        ...model,
        route: "direct",
        sourceProviderKey: normalizedProviderKey,
        providerKey: normalizedProviderKey,
        providerModelId,
        displayId,
        type: model.type || "",
        id: `${displayId}${DIRECT_MODEL_ID_SUFFIX}`,
      };
    }),
  } satisfies ModelResponse;
};

export const listModelsWithSplitProviderHeaders = async ({
  modelsApi,
  getAccessToken,
  customHeaders,
  providerKey,
  directProviderModels,
  includeGatewayModels,
  providers,
  onProgress,
}: {
  modelsApi: string;
  getAccessToken?: () => Promise<string>;
  customHeaders?: Record<string, string>;
  providerKey?: string;
  directProviderModels?: boolean;
  includeGatewayModels?: boolean;
  providers?: Record<string, Provider>;
  onProgress?: (progress: ModelsListProgress) => void;
}) => {
  const shouldIncludeGatewayModels = includeGatewayModels ?? !directProviderModels;

  const directProviderRequests = directProviderModels
    ? providerKey
      ? (() => {
        const apiKey = getExactProviderApiKeyHeaderEntry(customHeaders, providerKey, providers)?.[1]?.trim();
        return apiKey ? [{ providerKey, apiKey }] : [];
      })()
      : getDirectProviderModelRequests(customHeaders, providers)
    : [];
  const providerHeaderEntries = providerKey
    ? getProviderApiKeyHeaderEntries(customHeaders, providerKey, providers)
    : getConfiguredProviderHeaderEntries(customHeaders);
  const includeAnonymousRequest = shouldIncludeGatewayModels && !getAccessToken && !providerKey;
  const gatewayRequestTotal = shouldIncludeGatewayModels
    ? getAccessToken
      ? 1
      : providerKey ? 1 : (includeAnonymousRequest ? 1 : 0) + providerHeaderEntries.length
    : 0;
  const total = gatewayRequestTotal + directProviderRequests.length;
  const responses: ModelResponse[] = [];
  let completed = 0;
  let lastError: unknown;

  const updateProgress = () => {
    onProgress?.({ completed, total, active: completed < total });
  };

  const requestModels = async (headers?: Record<string, string>, requestProviderKey?: string, route: "gateway" | "direct" = "gateway") => {
    try {
      const client = createHttpClient(route === "gateway" && getAccessToken ? { getAccessToken, headers } : { headers });
      const requestModelsApi = requestProviderKey
        ? getProviderModelApi(getProvider(requestProviderKey, providers), modelsApi)
        : modelsApi;
      const response = enrichModelResponse(await client.get<ModelResponse>(requestModelsApi));
      responses.push(route === "direct"
        ? prefixProviderModelIds(response, requestProviderKey ?? providerKey)
        : annotateGatewayModelIds(response));
    } catch (err) {
      lastError = err;
      console.error("Failed to load models for provider header subset:", err);
    } finally {
      completed += 1;
      updateProgress();
    }
  };

  updateProgress();

  if (shouldIncludeGatewayModels) {
    if (getAccessToken) {
      await requestModels(customHeaders, undefined, "gateway");
    } else if (includeAnonymousRequest) {
      await requestModels(undefined, undefined, "gateway");
    }

    if (!getAccessToken) {
      if (providerKey) {
        await requestModels(createProviderHeaderSubsetForModel(customHeaders, providerKey, providers), undefined, "gateway");
      } else {
        for (const [header, value] of providerHeaderEntries) {
          await requestModels({ [header]: value }, undefined, "gateway");
        }
      }
    }
  }

  for (const request of directProviderRequests) {
    await requestModels(createBearerHeadersFromApiKey(request.apiKey), request.providerKey, "direct");
  }

  onProgress?.({ completed: total, total, active: false });

  if (responses.length === 0 && lastError) {
    throw lastError;
  }

  return mergeModelResponses(responses);
};
