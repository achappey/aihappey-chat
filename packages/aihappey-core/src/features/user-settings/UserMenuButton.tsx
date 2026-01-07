import React from "react";
import { useTheme } from "aihappey-components";

import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import { useChatContext } from "../chat/context/ChatContext";
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

  const enabledProviders = useAppStore((s) => s.enabledProviders ?? []);
  const toggleEnabledProvider = useAppStore((s) => s.toggleEnabledProvider);

  // Today enabledProviders in state is stored as *display names* (e.g. "OpenAI").
  const providers = React.useMemo(
    () => Object.entries(PROVIDERS).map(([, meta]: any) => meta.name).sort(),
    []
  );

  return (
    <>
      <UserMenu
        email={email}
        onSettings={onSettings}
        onLogout={onLogout}
        showApiKeysItem={!isEntraAuth}
        onApiKeys={() => setProviderKeysOpen(true)}
        providers={providers}
        enabledProviders={enabledProviders}
        onToggleProvider={toggleEnabledProvider}
        labels={{
          providers: t("providers"),
          apiKeys: t("apiKeys"),
          settings: t("userMenu.settings"),
          logout: t("userMenu.logout"),
        }}
        className={className}
        style={style}
      />

      <ProviderKeysModal open={providerKeysOpen} onClose={() => setProviderKeysOpen(false)} />
    </>
  );
};
