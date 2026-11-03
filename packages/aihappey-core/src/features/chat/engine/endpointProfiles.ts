import {
  CHAT_ENDPOINT_IDS,
  resolvePreferredProviderChatEndpoint,
  type ChatEndpointId,
  type ChatEndpointMode,
} from "aihappey-state";
import type { ModelOption, Provider } from "aihappey-types";
import { getModelProviderKey as getSharedModelProviderKey, stripHiddenDirectModelIdSuffix } from "aihappey-types";
import { PROVIDERS } from "../../../runtime/providers/providerMetadata";
import { sanitizeProviderRequestConfigForProvider } from "../../../runtime/providers/providerRequestConfig";
import { getProviderHeadersForKey } from "aihappey-state";
import { isGenericChatEndpoint } from "./genericChatEndpoint";
import { getExactProviderApiKeyHeaderEntry } from "../../provider-credentials/providerAuthHeaders";

export const GATEWAY_CHAT_ENDPOINT_IDS: ChatEndpointId[] = [
  "/api/chat", "/v1/responses", "/v1/messages", "/v1/chat/completions",
];

export const DEFAULT_ENDPOINT_PROFILE_ID = "default";
export const CUSTOM_ENDPOINT_PROFILE_ID = "custom";
export const DIRECT_ENDPOINT_PROFILE_ID = "direct";
export const PROVIDER_ENDPOINT_PROFILE_PREFIX = "provider:";

export type EndpointProfileKind = "default" | "provider" | "custom";

export type EndpointProfile = {
  id: string;
  kind: EndpointProfileKind;
  label: string;
  providerKey?: string;
  provider?: Provider;
  apiBaseUrl?: string;
  chatEndpoints: ChatEndpointId[];
  selectedChatEndpoint?: ChatEndpointId;
};

export const getModelRoute = (model?: ModelOption | null): "gateway" | "direct" =>
  (model as any)?.route === "direct" ? "direct" : "gateway";

export const isDirectModelRoute = (model?: ModelOption | null) => getModelRoute(model) === "direct";

export const getModelProviderKey = (modelId?: string, model?: ModelOption | null) => {
  return getSharedModelProviderKey(modelId, model);
};

const normalizeProviderKey = (value?: string) => String(value ?? "").trim().toLowerCase() || undefined;

export const isEndpointProfileCompatibleWithModelProvider = (
  profile: EndpointProfile | undefined,
  modelProviderKey?: string,
) => {
  if (profile?.kind !== "provider") return true;

  const profileProviderKey = normalizeProviderKey(profile.providerKey);
  return !!profileProviderKey && !!modelProviderKey && profileProviderKey === modelProviderKey;
};

export const validateEndpointProfileForModel = ({
  endpointProfile,
  modelId,
  model,
}: {
  endpointProfile?: EndpointProfile;
  modelId?: string;
  model?: ModelOption | null;
}) => {
  const modelProviderKey = getModelProviderKey(modelId, model);
  return isEndpointProfileCompatibleWithModelProvider(endpointProfile, modelProviderKey)
    ? endpointProfile
    : undefined;
};

const toChatEndpointIds = (values?: string[]) => Array.from(new Set(
  (values ?? []).filter((value): value is ChatEndpointId =>
    (CHAT_ENDPOINT_IDS as readonly string[]).includes(value),
  ),
));

const providerRegistryOrDefault = (providers?: Record<string, Provider>) => providers ?? PROVIDERS;

const isZaiAgentModel = (modelId?: string, model?: ModelOption | null) => {
  const localModelId = (getProviderModelId(model) ?? stripProviderPrefix(modelId, "zai")).trim().toLowerCase();
  return localModelId.startsWith("agents/");
};

const resolvePreferredProviderChatEndpointForModel = ({
  providerKey,
  chatEndpoints,
  modelId,
  model,
  selectedChatEndpoint,
}: {
  providerKey?: string;
  chatEndpoints: ChatEndpointId[];
  modelId?: string;
  model?: ModelOption | null;
  selectedChatEndpoint?: ChatEndpointId;
}) => {
  if (providerKey === "zai" && isZaiAgentModel(modelId, model) && chatEndpoints.includes("/v1/agents")) {
    return "/v1/agents" as ChatEndpointId;
  }

  return resolvePreferredProviderChatEndpoint(chatEndpoints, selectedChatEndpoint);
};

const hasProviderEndpointProfile = (entry: [string, Provider]) => {
  const [, provider] = entry;
  return typeof provider.apiBaseUrl === "string"
    && provider.apiBaseUrl.trim().length > 0
    && toChatEndpointIds(provider.chatEndpoints).some(isGenericChatEndpoint);
};

export const getProviderEndpointProfileId = (providerKey: string) =>
  `${PROVIDER_ENDPOINT_PROFILE_PREFIX}${providerKey}`;

export const getProviderKeyFromEndpointProfileId = (profileId?: string) => {
  if (!profileId?.startsWith(PROVIDER_ENDPOINT_PROFILE_PREFIX)) return undefined;
  return profileId.slice(PROVIDER_ENDPOINT_PROFILE_PREFIX.length) || undefined;
};

export const resolveProviderEndpointProfileForModel = ({
  modelId,
  endpoint,
  providers,
}: {
  modelId?: string;
  endpoint?: string;
  providers?: Record<string, Provider>;
}) => {
  const providerKey = String(modelId ?? "").split("/")[0]?.trim().toLowerCase();
  if (!providerKey || !endpoint) return undefined;

  return getEndpointProfiles({ providers }).find((profile) =>
    profile.kind === "provider"
    && profile.providerKey === providerKey
    && profile.chatEndpoints.includes(endpoint as ChatEndpointId),
  );
};

export const getEndpointProfiles = ({
  configuredChatEndpoint,
  providers,
}: {
  configuredChatEndpoint?: ChatEndpointId;
  providers?: Record<string, Provider>;
}): EndpointProfile[] => {
  const defaultEndpoint = configuredChatEndpoint ?? "/api/chat";
  const providerRegistry = providerRegistryOrDefault(providers);

  return [
    {
      id: DEFAULT_ENDPOINT_PROFILE_ID,
      kind: "default",
      label: "Default gateway",
      chatEndpoints: [...GATEWAY_CHAT_ENDPOINT_IDS],
      selectedChatEndpoint: GATEWAY_CHAT_ENDPOINT_IDS.includes(defaultEndpoint) ? defaultEndpoint : "/api/chat",
    },
    ...Object.entries(providerRegistry)
      .filter(hasProviderEndpointProfile)
      .map(([providerKey, provider]) => ({
        id: getProviderEndpointProfileId(providerKey),
        kind: "provider" as const,
        label: provider.name,
        providerKey,
        provider,
        apiBaseUrl: provider.apiBaseUrl?.trim(),
        chatEndpoints: toChatEndpointIds(provider.chatEndpoints).filter(isGenericChatEndpoint),
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    {
      id: CUSTOM_ENDPOINT_PROFILE_ID,
      kind: "custom",
      label: "Custom override",
      chatEndpoints: [...CHAT_ENDPOINT_IDS],
    },
  ];
};

export const resolveEndpointProfile = ({
  selectedEndpointProfileId,
  selectedBaseUrl,
  configuredChatEndpoint,
  providers,
}: {
  selectedEndpointProfileId?: string;
  selectedBaseUrl?: string;
  configuredChatEndpoint?: ChatEndpointId;
  providers?: Record<string, Provider>;
}) => {
  const profiles = getEndpointProfiles({ configuredChatEndpoint, providers });
  const hasManualOverride = !!selectedBaseUrl;
  const fallbackProfileId = hasManualOverride
    ? CUSTOM_ENDPOINT_PROFILE_ID
    : DEFAULT_ENDPOINT_PROFILE_ID;
  const profileId = selectedEndpointProfileId ?? fallbackProfileId;

  return profiles.find((profile) => profile.id === profileId)
    ?? profiles.find((profile) => profile.id === fallbackProfileId)
    ?? profiles[0];
};

export const resolveDirectEndpointProfileForModel = ({
  modelId,
  model,
  selectedChatEndpoint,
  providers,
}: {
  modelId?: string;
  model?: ModelOption | null;
  selectedChatEndpoint?: ChatEndpointId;
  providers?: Record<string, Provider>;
}) => {
  const providerKey = getModelProviderKey(modelId, model);
  if (!providerKey) return undefined;

  const providerRegistry = providerRegistryOrDefault(providers);
  const provider = providerRegistry[providerKey];
  if (!provider || !hasProviderEndpointProfile([providerKey, provider])) return undefined;

  const chatEndpoints = toChatEndpointIds(provider.chatEndpoints).filter(isGenericChatEndpoint);
  return {
    id: getProviderEndpointProfileId(providerKey),
    kind: "provider" as const,
    label: provider.name,
    providerKey,
    provider,
    apiBaseUrl: provider.apiBaseUrl?.trim(),
    chatEndpoints,
    selectedChatEndpoint: resolvePreferredProviderChatEndpointForModel({
      providerKey,
      chatEndpoints,
      modelId,
      model,
      selectedChatEndpoint,
    }),
  };
};

export const resolveEndpointProfileChatEndpoint = ({
  endpointProfile,
  selectedChatEndpoint,
}: {
  endpointProfile?: EndpointProfile;
  selectedChatEndpoint?: ChatEndpointId;
}) => {
  if (!endpointProfile) return selectedChatEndpoint;

  if (endpointProfile.kind === "provider") {
    return endpointProfile.selectedChatEndpoint
      ?? resolvePreferredProviderChatEndpoint(endpointProfile.chatEndpoints, selectedChatEndpoint)
      ?? endpointProfile.chatEndpoints[0];
  }

  if (endpointProfile.kind === "default") {
    return selectedChatEndpoint && endpointProfile.chatEndpoints.includes(selectedChatEndpoint)
      ? selectedChatEndpoint : endpointProfile.selectedChatEndpoint ?? "/api/chat";
  }

  return selectedChatEndpoint ?? endpointProfile.chatEndpoints[0];
};

export const resolveChatEndpointModeProfile = ({
  mode,
  modelId,
  model,
  selectedChatEndpoint,
  configuredChatEndpoint,
  providers,
}: {
  mode?: ChatEndpointMode;
  modelId?: string;
  model?: ModelOption | null;
  selectedChatEndpoint?: ChatEndpointId;
  configuredChatEndpoint?: ChatEndpointId;
  providers?: Record<string, Provider>;
}) => {
  if (mode === "direct") {
    return resolveDirectEndpointProfileForModel({ modelId, model, selectedChatEndpoint, providers });
  }

  return getEndpointProfiles({ configuredChatEndpoint, providers })[0];
};

export const resolveEndpointProfileForSelectedModel = ({
  mode,
  modelId,
  model,
  selectedChatEndpoint,
  configuredChatEndpoint,
  providers,
}: {
  mode?: ChatEndpointMode;
  modelId?: string;
  model?: ModelOption | null;
  selectedEndpointProfileId?: string;
  selectedBaseUrl?: string;
  selectedChatEndpoint?: ChatEndpointId;
  configuredChatEndpoint?: ChatEndpointId;
  providers?: Record<string, Provider>;
}) => {
  if (mode === "direct") {
    return resolveDirectEndpointProfileForModel({ modelId, model, selectedChatEndpoint, providers });
  }

  return getEndpointProfiles({ configuredChatEndpoint, providers })[0];
};

/** One decision owns the destination, protocol and model ID; never infer transport from a model's discovery source. */
export const resolveChatRoute = ({
  mode, selectedChatEndpoint, modelId, model, providers, customHeaders,
  gatewayEnabled = true, authenticated = false,
}: {
  mode?: ChatEndpointMode;
  selectedChatEndpoint?: ChatEndpointId;
  modelId?: string;
  model?: ModelOption | null;
  providers?: Record<string, Provider>;
  customHeaders?: Record<string, string>;
  gatewayEnabled?: boolean;
  authenticated?: boolean;
}) => {
  const directProfile = authenticated ? undefined
    : resolveDirectEndpointProfileForModel({ modelId, model, providers, selectedChatEndpoint });
  const directAvailable = !!directProfile?.selectedChatEndpoint
    && !!getExactProviderApiKeyHeaderEntry(customHeaders, directProfile.providerKey, providers)?.[1]?.trim();
  const useDirect = !authenticated && (mode === "direct" || !gatewayEnabled) && directAvailable;
  const resolvedMode: ChatEndpointMode = useDirect || (!gatewayEnabled && !authenticated) ? "direct" : "default";
  const endpoint = useDirect ? directProfile!.selectedChatEndpoint!
    : resolvedMode === "default" && mode !== "direct" && selectedChatEndpoint && GATEWAY_CHAT_ENDPOINT_IDS.includes(selectedChatEndpoint)
      ? selectedChatEndpoint : "/api/chat";
  const profile = useDirect ? directProfile : getEndpointProfiles({ configuredChatEndpoint: "/api/chat", providers })[0];
  return {
    mode: resolvedMode,
    endpoint: endpoint as ChatEndpointId,
    endpointProfile: profile,
    directProfile,
    directAvailable,
    available: useDirect || gatewayEnabled,
    error: useDirect || gatewayEnabled ? undefined
      : "Direct access is unavailable for this model. Configure a provider API key or enable the gateway in settings.",
  };
};

export const stripProviderPrefix = (modelId?: string, providerKey?: string) => {
  const value = stripHiddenDirectModelIdSuffix(modelId);
  const slashIndex = value.indexOf("/");
  if (slashIndex <= 0) return value;

  const prefix = value.slice(0, slashIndex).toLowerCase();
  if (providerKey) {
    return prefix === providerKey.toLowerCase()
      ? value.slice(slashIndex + 1)
      : value;
  }

  return Object.prototype.hasOwnProperty.call(PROVIDERS, prefix)
    ? value.slice(slashIndex + 1)
    : value;
};

export const getProviderModelId = (model?: ModelOption | null) => {
  const providerModelId = (model as any)?.providerModelId;
  return typeof providerModelId === "string" && providerModelId.trim().length
    ? providerModelId.trim()
    : undefined;
};

export const resolveProviderRequestModelId = ({
  modelId,
  providerKey,
  model,
}: {
  modelId?: string;
  providerKey?: string;
  model?: ModelOption | null;
}) => getProviderModelId(model) ?? stripProviderPrefix(modelId, providerKey);

const cloneProviderMetadataForKey = (
  metadata: Record<string, any> | undefined,
  providerKey?: string,
) => {
  if (!metadata || !providerKey) return undefined;

  const value = metadata[providerKey];
  if (value === undefined) return undefined;

  return { [providerKey]: sanitizeProviderRequestConfigForProvider(value, providerKey) ?? {} };
};

const cloneProviderHeadersForKey = (
  providerHeaders: Record<string, any> | undefined,
  providerKey?: string,
) => {
  const headers = getProviderHeadersForKey(providerHeaders, providerKey);
  return headers ? { [providerKey!]: headers } : undefined;
};

export const resolveEndpointProfileRequestMetadata = ({
  activeProviderMetadata,
  providerMetadata,
  endpointProfile,
  fallbackProviderMetadataEnabled,
}: {
  activeProviderMetadata?: Record<string, any>;
  providerMetadata?: Record<string, any>;
  endpointProfile?: EndpointProfile;
  fallbackProviderMetadataEnabled: boolean;
}) => {
  if (endpointProfile?.kind !== "provider") {
    if (!fallbackProviderMetadataEnabled || !activeProviderMetadata) return undefined;
    if (!activeProviderMetadata.anthropic) return activeProviderMetadata;
    return {
      ...activeProviderMetadata,
      anthropic: sanitizeProviderRequestConfigForProvider(activeProviderMetadata.anthropic, "anthropic") ?? {},
    };
  }

  const profileProviderKey = endpointProfile.providerKey;
  if (!profileProviderKey) return activeProviderMetadata;

  return cloneProviderMetadataForKey(providerMetadata, profileProviderKey)
    ?? cloneProviderMetadataForKey(activeProviderMetadata, profileProviderKey);
};

export const resolveEndpointProfileRequestProviderHeaders = ({
  providerHeaders,
  endpointProfile,
  selectedModelProviderKey,
}: {
  providerHeaders?: Record<string, any>;
  endpointProfile?: EndpointProfile;
  selectedModelProviderKey?: string;
}) => {
  const profileProviderKey = endpointProfile?.kind === "provider"
    ? endpointProfile.providerKey
    : undefined;

  return cloneProviderHeadersForKey(providerHeaders, profileProviderKey ?? selectedModelProviderKey);
};

export const resolveEndpointProfileProviderHeaders = ({
  providerHeaders,
  endpointProfile,
}: {
  providerHeaders?: Record<string, any>;
  endpointProfile?: EndpointProfile;
}) => {
  if (endpointProfile?.kind !== "provider" || !endpointProfile.providerKey) return undefined;

  return getProviderHeadersForKey(providerHeaders, endpointProfile.providerKey);
};

const asRecord = (value: unknown): Record<string, any> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, any>
    : undefined;

export const resolveEndpointProfileProviderConfig = ({
  activeProviderMetadata,
  providerMetadata,
  endpointProfile,
}: {
  activeProviderMetadata?: Record<string, any>;
  providerMetadata?: Record<string, any>;
  endpointProfile?: EndpointProfile;
}) => {
  if (endpointProfile?.kind !== "provider" || !endpointProfile.providerKey) return undefined;

  const profileProviderKey = endpointProfile.providerKey;
  const profileProviderConfig = asRecord(providerMetadata?.[profileProviderKey])
    ?? asRecord(activeProviderMetadata?.[profileProviderKey]);

  return sanitizeProviderRequestConfigForProvider(profileProviderConfig, profileProviderKey);
};

export const splitEndpointProfileProviderConfig = (
  config?: Record<string, any>,
  providerKey?: string,
  endpointId?: string,
) => {
  if (!config) return { body: undefined, headers: undefined } as const;

  const { headers, ...body } = config;
  const normalizedHeaders = asRecord(headers);
  const sanitizedBody = sanitizeProviderRequestConfigForProvider(body, providerKey, { endpointId });

  return {
    body: sanitizedBody,
    headers: normalizedHeaders
      ? Object.fromEntries(
        Object.entries(normalizedHeaders)
          .filter(([key, value]) => key.trim().length > 0 && value != null && String(value).trim().length > 0)
          .map(([key, value]) => [key, String(value)]),
      )
      : undefined,
  } as const;
};
