import React from "react";
import { useTheme } from "aihappey-components";

import { useTranslation } from "aihappey-i18n";
import { PROVIDER_CAPABILITIES, useAppStore, type ProviderCapability } from "aihappey-state";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import { useChatContext } from "../chat/context/ChatContext";
import { GATEWAY_CHAT_ENDPOINT_IDS } from "../chat/engine/endpointProfiles";
import { useChatRoute } from "../chat/engine/useChatRoute";
import { ProviderKeysModal } from "../provider-credentials/ProviderKeysModal";

interface UserMenuButtonProps {
  email?: string;
  onSettings: () => void;
  onLogout: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const UserMenuButton: React.FC<UserMenuButtonProps> = ({
  email,
  onSettings,
  onLogout,
  className,
  style,
}) => {
  const { UserMenu } = useTheme();
  const { t } = useTranslation();

  const chat = useChatContext();
  const isEntraAuth = chat?.config?.getAccessToken != null;
  const [providerKeysOpen, setProviderKeysOpen] = React.useState(false);

  const enabledProvidersByType = useAppStore((s) => s.enabledProvidersByType);
  const toggleEnabledProviderForType = useAppStore((s) => s.toggleEnabledProviderForType);
  const models = useAppStore((s) => s.models ?? []);
  const modelsLoaded = useAppStore((s) => s.modelsLoaded);
  const setSelectedChatEndpoint = useAppStore((s) => s.setSelectedChatEndpoint);
  const setSelectedChatEndpointMode = useAppStore((s) => s.setSelectedChatEndpointMode);
  const route = useChatRoute(chat.config);

  // Today enabledProviders in state is stored as *display names* (e.g. "OpenAI").
  const providers = React.useMemo(
    () => Object.entries(PROVIDERS).map(([, meta]: any) => meta.name).sort(),
    []
  );

  // For disabling providers that didn't return any models.
  const providerNameToKey = React.useMemo(
    () =>
      Object.entries(PROVIDERS).reduce((acc, [key, meta]: any) => {
        acc[meta.name] = key;
        return acc;
      }, {} as Record<string, string>),
    []
  );

  const providersWithModels = React.useMemo(() => {
    const set = new Set<string>();
    for (const m of models ?? []) {
      const providerKey = m.id?.split("/")?.[0]?.toLowerCase();
      if (providerKey) set.add(providerKey);
    }
    return set;
  }, [models]);

  const visibleProviders = React.useMemo(() => {
    if (!modelsLoaded) return [];
    return providers.filter((name) => {
      const key = providerNameToKey[name];
      return !!key && providersWithModels.has(key);
    });
  }, [modelsLoaded, providerNameToKey, providers, providersWithModels]);

  const visibleProvidersSet = React.useMemo(
    () => new Set(visibleProviders),
    [visibleProviders]
  );

  const visibleEnabledProvidersByType = React.useMemo(
    () =>
      Object.fromEntries(
        Object.entries(enabledProvidersByType ?? {}).map(([capability, names]) => [
          capability,
          (names ?? []).filter((name) => visibleProvidersSet.has(name)),
        ])
      ) as typeof enabledProvidersByType,
    [enabledProvidersByType, visibleProvidersSet]
  );

  const disabledProviders = React.useMemo(() => {
    // While loading, we disable everything via `providersDisabled`.
    // Once loaded, disable providers that returned 0 models.
    if (!modelsLoaded) return [];
    return providers.filter((name) => {
      const key = providerNameToKey[name];
      return !key || !providersWithModels.has(key);
    });
  }, [modelsLoaded, providers, providerNameToKey, providersWithModels]);

  const providerGroups = React.useMemo(() => {
    // Group provider toggles by capability, derived from loaded models.
    // Only include groups that have at least 1 provider.
    const keyToName = Object.entries(PROVIDERS).reduce((acc, [key, meta]: any) => {
      acc[key.toLowerCase()] = meta.name;
      return acc;
    }, {} as Record<string, string>);

    const allowed = [...PROVIDER_CAPABILITIES] as ProviderCapability[];

    const byCap: Record<ProviderCapability, Set<string>> = {
      language: new Set<string>(),
      image: new Set<string>(),
      embedding: new Set<string>(),
      audio: new Set<string>(),
      speech: new Set<string>(),
      transcription: new Set<string>(),
      decision: new Set<string>(),
      reranking: new Set<string>(),
      video: new Set<string>(),
    };

    for (const m of models ?? []) {
      const cap = m.type as ProviderCapability;
      if (!allowed.includes(cap)) continue;

      const providerKey = m.id?.split("/")?.[0]?.toLowerCase();
      const name = providerKey ? keyToName[providerKey] : undefined;
      if (!name) continue;

      byCap[cap].add(name);
    }

    const result: Record<string, string[]> = {};
    for (const cap of allowed) {
      const list = Array.from(byCap[cap]).sort();
      if (list.length) result[cap] = list;
    }

    return result;
  }, [models]);

  const chatEndpointGroups = [
    {
      value: "default",
      label: t("settingsModal.gateway", "Gateway"),
      disabled: !route.gatewayAvailable,
      options: GATEWAY_CHAT_ENDPOINT_IDS.map(endpoint => ({ value: `default:${endpoint}`, label: endpoint })),
    },
    ...(!isEntraAuth ? [{
      value: "direct",
      label: t("settingsModal.direct", "Direct"),
      disabled: !route.directAvailable,
      options: (route.directProfile?.chatEndpoints ?? []).map(endpoint => ({ value: `direct:${endpoint}`, label: endpoint })),
    }] : []),
  ];

  const handleSelectChatEndpoint = React.useCallback(
    (endpoint: string) => {
      const group = chatEndpointGroups.find(group => !group.disabled && group.options.some(option => option.value === endpoint));
      if (!group) return;
      setSelectedChatEndpointMode(group.value);
      setSelectedChatEndpoint(endpoint.slice(endpoint.indexOf(":") + 1));
    },
    [chatEndpointGroups, setSelectedChatEndpoint, setSelectedChatEndpointMode]
  );

  return (
    <>
      <UserMenu
        email={email}
        onSettings={onSettings}
        onLogout={onLogout}
        showApiKeysItem={!isEntraAuth}
        onApiKeys={() => setProviderKeysOpen(true)}
        showChatEndpointsItem={true}
        chatEndpointGroups={chatEndpointGroups}
        selectedChatEndpoint={route.available ? `${route.mode}:${route.endpoint}` : undefined}
        onSelectChatEndpoint={handleSelectChatEndpoint}
        providers={visibleProviders}
        providerGroups={providerGroups}
        enabledProvidersByType={visibleEnabledProvidersByType as any}
        onToggleProviderForType={toggleEnabledProviderForType as any}
        providersDisabled={!modelsLoaded}
        disabledProviders={disabledProviders}
        labels={{
          providers: t("providers"),
          apiKeys: t("apiKeys"),
          chatEndpoint: t("settingsModal.chatEndpoint"),
          noChatEndpoints: t("settingsModal.chatEndpoint"),
          settings: t("userMenu.settings"),
          logout: t("userMenu.logout"),
          // Capability submenu labels (translated in the parent).
          language: t("language"),
          image: t("image"),
          embedding: t("embedding"),
          audio: t("realtime"),
          speech: t("speech"),
          next: t("next"),
          previous: t("previous"),
          transcription: t("transcription"),
          decision: t("decision"),
          reranking: t("reranking"),
          video: t("video"),
        }}
        className={className}
        style={style}
      />

      <ProviderKeysModal open={providerKeysOpen} onClose={() => setProviderKeysOpen(false)} />
    </>
  );
};
