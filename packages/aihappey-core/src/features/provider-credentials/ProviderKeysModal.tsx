import React, { useMemo } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { useDarkMode } from "usehooks-ts";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";

export interface ProviderKeysModalProps {
  open: boolean;
  onClose: () => void;
}

// Keep behavior identical: same 10 headers as before (no Pollinations here).
const API_KEY_PROVIDER_IDS = [
  "openai",
  "mistral",
  "anthropic",
  "google",
  "perplexity",
  "cohere",
  "jina",
  "xai",
  "groq",
  "together",
] as const;

type ApiKeyProviderId = (typeof API_KEY_PROVIDER_IDS)[number];

function headerFor(id: ApiKeyProviderId): string {
  // matches your existing header names exactly, e.g. X-xAI-Key
  return `X-${PROVIDERS[id].name}-Key`;
}

function pickIconSrc(
  icons: readonly { src: string; theme?: "light" | "dark" }[] | undefined,
  isDarkMode: boolean
) {
  if (!icons?.length) return undefined;
  const desired = isDarkMode ? "dark" : "light";
  return icons.find((i) => i.theme === desired)?.src ?? icons[0].src;
}

export const ProviderKeysModal: React.FC<ProviderKeysModalProps> = ({
  open,
  onClose,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { isDarkMode } = useDarkMode();

  const customHeaders = useAppStore((s) => s.customHeaders);
  const addCustomHeader = useAppStore((s) => s.addCustomHeader);
  const removeCustomHeader = useAppStore((s) => s.removeCustomHeader);

  const providers = useMemo(() => {
    return API_KEY_PROVIDER_IDS.map((id) => ({
      id,
      provider: PROVIDERS[id],
      header: headerFor(id),
    })).sort((a, b) => a.provider.name.localeCompare(b.provider.name));
  }, []);

  return (
    <theme.Modal
      show={open}
      onHide={onClose}
      title={t("apiKeys")}
      actions={
        <theme.Button variant="secondary" onClick={onClose}>
          {t("close")}
        </theme.Button>
      }
    >
      <theme.Card size="small" title={t("providers")}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {providers.map(({ header, provider }) => {
            const current = customHeaders?.[header] ?? "";
            const iconSrc = pickIconSrc(provider.icons, isDarkMode);

            return (
              <div
                key={header}
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  width: "100%",
                  alignItems: "center",
                }}
              >
                {iconSrc ? <theme.Image width={24} src={iconSrc} /> : null}

                <div style={{ width: "120px", fontWeight: 600 }}>
                  {provider.name}
                </div>

                <theme.Input
                  value={current}
                  style={{ flexGrow: 1 }}
                  placeholder={`${provider.name} ${t("apiKey")}...`}
                  onChange={(e: any) => addCustomHeader(header, e.target.value)}
                />

                <theme.Button
                  icon="delete"
                  disabled={!current}
                  variant="danger"
                  size="small"
                  onClick={() => removeCustomHeader(header)}
                />
              </div>
            );
          })}
        </div>
      </theme.Card>
    </theme.Modal>
  );
};
