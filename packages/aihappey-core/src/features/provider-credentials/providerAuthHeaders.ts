import { createHttpClient } from "aihappey-http";
import type { ModelResponse } from "aihappey-types";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import { enrichModelTypes } from "../models/modelTypeEnrichment";
import type { Provider } from "aihappey-types";
import { HIDDEN_DIRECT_MODEL_ID_SUFFIX } from "aihappey-types";
import zaiModels from "../../runtime/providers/catalog/models/zai.json";
import { enrichDirectModelsWithProviderPricing } from "../../runtime/providers/catalog/providerPricing";

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

type GoogleModel = {
  name?: string;
  baseModelId?: string;
  version?: string;
  displayName?: string;
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
  thinking?: boolean;
};

const STATIC_DIRECT_MODEL_RESPONSES: Record<string, ModelResponse> = {
  zai: zaiModels as unknown as ModelResponse,
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

const getGoogleProviderModelApi = (provider: ProviderLike | undefined, modelsApi: string) => {
  const baseUrl = provider?.apiBaseUrl?.trim();
  if (!baseUrl) return modelsApi;

  return `${baseUrl.replace(/\/$/, "")}/v1beta/models?pageSize=1000`;
};

const getProviderModelApiForKey = (provider: ProviderLike | undefined, providerKey: string | undefined, modelsApi: string) => {
  if (normalizeLookupValue(providerKey) === "google") {
    return getGoogleProviderModelApi(provider, modelsApi);
  }

  return getProviderModelApi(provider, modelsApi);
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

const stripBearerPrefix = (value?: string) => {
  const apiKey = value?.trim();

  if (!apiKey) return undefined;

  return apiKey.toLowerCase().startsWith("bearer ")
    ? apiKey.slice("bearer ".length).trim()
    : apiKey;
};

const createMessagesEndpointHeadersFromApiKey = (value?: string) => {
  const apiKey = stripBearerPrefix(value);

  return {
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
    ...(apiKey ? { "x-api-key": apiKey } : {}),
  } satisfies Record<string, string>;
};

const createDirectProviderModelHeadersFromApiKey = (value: string, providerKey?: string) => {
  if (normalizeLookupValue(providerKey) === "anthropic") {
    return createMessagesEndpointHeadersFromApiKey(value);
  }

  if (normalizeLookupValue(providerKey) === "google") {
    const apiKey = stripBearerPrefix(value);
    return apiKey ? { "x-goog-api-key": apiKey } : {};
  }

  return createBearerHeadersFromApiKey(value);
};

export const createMessagesEndpointHeadersForProviderKey = (
  customHeaders: Record<string, string> | undefined,
  providerKey?: string,
  providers?: Record<string, ProviderLike>,
) => {
  const entry = getExactProviderApiKeyHeaderEntry(customHeaders, providerKey, providers);
  const value = entry?.[1]?.trim();

  return createMessagesEndpointHeadersFromApiKey(value);
};

export const createMessagesEndpointAuthHeadersForModel = (
  customHeaders: Record<string, string> | undefined,
  modelId?: string,
  hasAccessToken?: boolean,
  providers?: Record<string, ProviderLike>,
) => {
  const providerKey = getProviderKeyFromModelId(modelId);

  if (hasAccessToken) {
    return createMessagesEndpointHeadersFromApiKey();
  }

  return {
    ...createMessagesEndpointHeadersForProviderKey(customHeaders, providerKey, providers),
    ...createEndpointHeaders(customHeaders, providers),
  };
};

export const createProviderBearerHeadersForProviderKey = (
  customHeaders: Record<string, string> | undefined,
  providerKey?: string,
  providers?: Record<string, ProviderLike>,
) => {
  const entry = getExactProviderApiKeyHeaderEntry(customHeaders, providerKey, providers);
  const value = entry?.[1]?.trim();

  if (normalizeLookupValue(providerKey) === "google") {
    const apiKey = stripBearerPrefix(value);
    return apiKey ? { "x-goog-api-key": apiKey } : {};
  }

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

const normalizeGoogleModelId = (model: GoogleModel) => {
  const name = String(model.name ?? "").trim();
  if (name.toLowerCase().startsWith("models/")) return name.slice("models/".length);
  return model.baseModelId?.trim() || name;
};

const mapGoogleModelResponse = (response: any): ModelResponse => ({
  data: (response?.models ?? [])
    .map((model: GoogleModel) => {
      const id = normalizeGoogleModelId(model);
      if (!id) return undefined;

      const supportedGenerationMethods = Array.isArray(model.supportedGenerationMethods)
        ? model.supportedGenerationMethods
        : [];

      return {
        id,
        name: model.displayName || id,
        description: model.description,
        type: "language",
        context_window: model.inputTokenLimit,
        max_tokens: model.outputTokenLimit,
        owned_by: "google",
        tags: [
          ...supportedGenerationMethods,
          ...(model.thinking ? ["thinking"] : []),
          ...(model.version ? [`version:${model.version}`] : []),
        ],
      };
    })
    .filter(Boolean),
});

const normalizeDirectProviderModelResponse = (response: any, providerKey?: string) => {
  if (normalizeLookupValue(providerKey) === "google") {
    return mapGoogleModelResponse(response);
  }

  return response as ModelResponse;
};

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

const stripStaticProviderPrefix = (response: ModelResponse, providerKey?: string) => {
  const normalizedProviderKey = providerKey?.trim().toLowerCase();
  if (!normalizedProviderKey) return response;
  const prefix = `${normalizedProviderKey}/`;

  return {
    ...response,
    data: (response?.data ?? []).map((model: any) => ({
      ...model,
      id: typeof model.id === "string" && model.id.toLowerCase().startsWith(prefix)
        ? model.id.slice(prefix.length)
        : model.id,
    })),
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
      const staticDirectResponse = route === "direct" && requestProviderKey
        ? STATIC_DIRECT_MODEL_RESPONSES[requestProviderKey]
        : undefined;
      if (staticDirectResponse) {
        const response = enrichModelResponse(enrichDirectModelsWithProviderPricing(
          stripStaticProviderPrefix(staticDirectResponse, requestProviderKey),
          requestProviderKey,
        ));
        responses.push(prefixProviderModelIds(response, requestProviderKey ?? providerKey));
        return;
      }

      const client = createHttpClient(route === "gateway" && getAccessToken ? { getAccessToken, headers } : { headers });
      const requestModelsApi = requestProviderKey
        ? getProviderModelApiForKey(getProvider(requestProviderKey, providers), requestProviderKey, modelsApi)
        : modelsApi;
      const rawResponse = await client.get<any>(requestModelsApi);
      const normalizedResponse = route === "direct"
        ? enrichDirectModelsWithProviderPricing(
          normalizeDirectProviderModelResponse(rawResponse, requestProviderKey ?? providerKey),
          requestProviderKey ?? providerKey,
        )
        : rawResponse as ModelResponse;
      const response = enrichModelResponse(normalizedResponse);
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
    await requestModels(createDirectProviderModelHeadersFromApiKey(request.apiKey, request.providerKey), request.providerKey, "direct");
  }

  onProgress?.({ completed: total, total, active: false });

  if (responses.length === 0 && lastError) {
    throw lastError;
  }

  return mergeModelResponses(responses);
};
