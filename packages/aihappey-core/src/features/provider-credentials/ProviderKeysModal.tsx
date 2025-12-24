import React, { useCallback, useMemo } from "react";
import { ProviderKeysForm, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { useDarkMode } from "usehooks-ts";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}


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

function headerFor(id: ApiKeyProviderId) {
  return `X-${PROVIDERS[id].name}-Key`;
}

function pickIconSrc(
  icons: readonly { src: string; theme?: "light" | "dark" }[] | undefined,
  isDark: boolean
) {
  if (!icons?.length) return undefined;
  const wanted = isDark ? "dark" : "light";
  return icons.find((i) => i.theme === wanted)?.src ?? icons[0].src;
}

export interface ProviderKeysModalProps {
  open: boolean;
  onClose: () => void;
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

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;

      for (const file of Array.from(files)) {
        if (!file.name.toLowerCase().endsWith(".json")) continue;

        try {
          const text = await file.text();
          const json = JSON.parse(text);

          // Expecting: { "X-OpenAI-Key": "...", ... }
          if (typeof json !== "object" || json === null) continue;

          Object.entries(json).forEach(([header, value]) => {
            if (typeof value === "string") {
              addCustomHeader(header, value);
            }
          });
        } catch (err) {
          console.error("Failed to import API keys:", err);
        }
      }
    },
    [addCustomHeader]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const items = useMemo(() => {
    return API_KEY_PROVIDER_IDS.map((id) => {
      const provider = PROVIDERS[id];
      return {
        id,
        name: provider.name,
        header: headerFor(id),
        iconSrc: pickIconSrc(provider.icons, isDarkMode),
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [isDarkMode]);

  return (
    <theme.Modal
      show={open}
      onHide={onClose}
      title={t("apiKeys")}
      actions={
        <>
          <theme.Button
            variant="informative"
            icon="download"
            onClick={() =>
              downloadJson("provider_config.json", customHeaders ?? {})
            }
          />

          <theme.Button variant="secondary" onClick={onClose}>
            {t("close")}
          </theme.Button>
        </>
      }

    >
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{ width: "100%" }}
      >
        <ProviderKeysForm
          title={t("providers")}
          apiKeyLabel={t("apiKey")}
          items={items}
          values={customHeaders ?? {}}
          onChange={addCustomHeader}
          onRemove={removeCustomHeader}
        />
      </div>
    </theme.Modal>
  );
};
