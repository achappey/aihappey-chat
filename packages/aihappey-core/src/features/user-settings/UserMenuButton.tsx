import React from "react";
import { useTheme } from "aihappey-components";

import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import { useChatContext } from "../chat/context/ChatContext";
import { ProviderKeysModal } from "../provider-credentials/ProviderKeysModal";

type ProviderCapability = "language" | "image" | "speech" | "transcription" | "reranking";

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

  const enabledProviders = useAppStore((s) => s.enabledProviders ?? []);
  const toggleEnabledProvider = useAppStore((s) => s.toggleEnabledProvider);
  const models = useAppStore((s) => s.models ?? []);
  const modelsLoaded = useAppStore((s) => s.modelsLoaded);

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

    const allowed: ProviderCapability[] = [
      "language",
      "image",
      "speech",
      "transcription",
      "reranking",
    ];

    const byCap: Record<ProviderCapability, Set<string>> = {
      language: new Set<string>(),
      image: new Set<string>(),
      speech: new Set<string>(),
      transcription: new Set<string>(),
      reranking: new Set<string>(),
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

  return (
    <>
      <UserMenu
        email={email}
        onSettings={onSettings}
        onLogout={onLogout}
        showApiKeysItem={!isEntraAuth}
        onApiKeys={() => setProviderKeysOpen(true)}
        providers={providers}
        providerGroups={providerGroups}
        enabledProviders={enabledProviders}
        onToggleProvider={toggleEnabledProvider}
        providersDisabled={!modelsLoaded}
        disabledProviders={disabledProviders}
        labels={{
          providers: t("providers"),
          apiKeys: t("apiKeys"),
          settings: t("userMenu.settings"),
          logout: t("userMenu.logout"),
          // Capability submenu labels (translated in the parent).
          language: t("language"),
          image: t("image"),
          speech: t("speech"),
          transcription: t("transcription"),
          reranking: t("reranking"),
        }}
        className={className}
        style={style}
      />

      <ProviderKeysModal open={providerKeysOpen} onClose={() => setProviderKeysOpen(false)} />
    </>
  );
};
