import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProviderKeysForm, SettingsActionButtons, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { PROVIDER_CAPABILITIES, useAppStore } from "aihappey-state";
import { useDarkMode } from "usehooks-ts";
import { getProviderApiKeyHeaderName } from "./providerAuthHeaders";
import { useProviderRegistry } from "../../runtime/providers/useProviderRegistry";
import { ApiKeyPasswordModal, type ApiKeyPasswordModalMode } from "./ApiKeyPasswordModal";
import { decryptApiKeys, encryptApiKeys } from "./apiKeyEncryption";

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
const EXCLUDED_API_KEY_PROVIDER_IDS = new Set([
  "pollinations",
  "echo",
  "azure",
  "microsoft",
  "gtranslate",
]);

function headerFor(id: string, providers: Record<string, { name?: string }>) {
  return getProviderApiKeyHeaderName(id, providers) ?? `X-${id}-Key`;
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
  const providers = useProviderRegistry();

  const customHeaders = useAppStore((s) => s.customHeaders);
  const encryptedApiKeys = useAppStore((s: any) => s.encryptedApiKeys);
  const apiKeyEncryptionStatus = useAppStore((s: any) => s.apiKeyEncryptionStatus);
  const resetModels = useAppStore((s) => s.resetModels);
  const addCustomHeader = useAppStore((s) => s.addCustomHeader);
  const removeCustomHeader = useAppStore((s) => s.removeCustomHeader);
  const setCustomHeaders = useAppStore((s: any) => s.setCustomHeaders);
  const setEncryptedApiKeys = useAppStore((s: any) => s.setEncryptedApiKeys);
  const apiKeySessionPassword = useAppStore((s: any) => s.apiKeySessionPassword);
  const setApiKeySessionPassword = useAppStore((s: any) => s.setApiKeySessionPassword);
  const enabledProvidersByType = useAppStore((s) => s.enabledProvidersByType);
  const setEnabledProvidersForType = useAppStore((s) => s.setEnabledProvidersForType);

  const initialHeadersRef = useRef<Record<string, string>>({});
  const wasOpenRef = useRef(false);
  const [passwordMode, setPasswordMode] = useState<ApiKeyPasswordModalMode | undefined>(undefined);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const keysEditable = apiKeyEncryptionStatus === "unlocked";
  const canPersistKeyEdits = apiKeyEncryptionStatus === "unlocked";
  const passwordRequired = apiKeyEncryptionStatus === "none" || apiKeyEncryptionStatus === "needs-password";

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      initialHeadersRef.current = { ...(customHeaders ?? {}) };
    }
    wasOpenRef.current = open;
  }, [open, customHeaders]);

  const providerNameByHeader = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(providers)
          .filter((id) => !EXCLUDED_API_KEY_PROVIDER_IDS.has(id))
          .map((id) => [headerFor(id, providers), providers[id].name])
      ) as Record<string, string>,
    [providers]
  );

  const syncProviderEnabledState = useCallback(
    (header: string, enabled: boolean) => {
      const providerName = providerNameByHeader[header];
      if (!providerName) return;

      for (const capability of PROVIDER_CAPABILITIES) {
        const current = enabledProvidersByType?.[capability] ?? [];
        const next = enabled
          ? Array.from(new Set([...current, providerName]))
          : current.filter((name) => name !== providerName);

        setEnabledProvidersForType(capability, next);
      }
    },
    [enabledProvidersByType, providerNameByHeader, setEnabledProvidersForType]
  );

  const handleHeaderChange = useCallback(
    async (header: string, value: string) => {
      if (!canPersistKeyEdits) return;
      const nextHeaders = {
        ...(customHeaders ?? {}),
        [header]: value,
      };
      if (encryptedApiKeys) {
        if (!apiKeySessionPassword) return;
        setEncryptedApiKeys(await encryptApiKeys(nextHeaders, apiKeySessionPassword));
      }
      addCustomHeader(header, value);
      if (value.trim().length > 0) {
        syncProviderEnabledState(header, true);
      }
    },
    [addCustomHeader, apiKeySessionPassword, canPersistKeyEdits, customHeaders, encryptedApiKeys, setEncryptedApiKeys, syncProviderEnabledState]
  );

  const handleHeaderRemove = useCallback(
    async (header: string) => {
      if (!canPersistKeyEdits) return;
      const { [header]: _, ...nextHeaders } = customHeaders ?? {};
      if (encryptedApiKeys) {
        if (!apiKeySessionPassword) return;
        setEncryptedApiKeys(await encryptApiKeys(nextHeaders, apiKeySessionPassword));
      }
      removeCustomHeader(header);
      syncProviderEnabledState(header, false);
    },
    [apiKeySessionPassword, canPersistKeyEdits, customHeaders, encryptedApiKeys, removeCustomHeader, setEncryptedApiKeys, syncProviderEnabledState]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!keysEditable) return;

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
              handleHeaderChange(header, value);
            }
          });
        } catch (err) {
          console.error("Failed to import API keys:", err);
        }
      }
    },
    [handleHeaderChange, keysEditable]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const hasProviderKeysChangedThisSession = useCallback(() => {
    const before = initialHeadersRef.current;
    const after = customHeaders ?? {};

    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const key of keys) {
      if ((before[key] ?? "") !== (after[key] ?? "")) {
        return true;
      }
    }

    return false;
  }, [customHeaders]);

  const handleClose = useCallback(() => {
    if (hasProviderKeysChangedThisSession()) {
      (resetModels as any)({ keepSelectedModel: true });
    }
    onClose();
  }, [hasProviderKeysChangedThisSession, resetModels, onClose]);

  const encryptAndStoreHeaders = useCallback(async (headers: Record<string, string>, password: string) => {
    const encrypted = await encryptApiKeys(headers, password);
    setApiKeySessionPassword(password);
    setEncryptedApiKeys(encrypted);
    setCustomHeaders(headers);
  }, [setApiKeySessionPassword, setCustomHeaders, setEncryptedApiKeys]);

  const handlePasswordSubmit = useCallback(async ({ password, currentPassword }: { password: string; currentPassword?: string }) => {
    setPasswordBusy(true);
    setPasswordError(undefined);
    try {
      if (passwordMode === "change") {
        if (!encryptedApiKeys || !currentPassword) throw new Error(t("apiKeysPassword.invalidPassword"));
        const headers = await decryptApiKeys(encryptedApiKeys, currentPassword);
        await encryptAndStoreHeaders(headers, password);
      } else if (passwordMode === "set") {
        await encryptAndStoreHeaders(customHeaders ?? {}, password);
      }
      setPasswordMode(undefined);
    } catch {
      setPasswordError(t("apiKeysPassword.invalidPassword"));
    } finally {
      setPasswordBusy(false);
    }
  }, [customHeaders, encryptAndStoreHeaders, encryptedApiKeys, passwordMode, t]);

  const items = useMemo(() => {
    return Object.keys(providers).filter((id) => !EXCLUDED_API_KEY_PROVIDER_IDS.has(id)).map((id) => {
      const provider = providers[id];
      return {
        id,
        name: provider.name,
        header: headerFor(id, providers),
        iconSrc: pickIconSrc(provider.icons, isDarkMode),
        url: provider.urls?.console ?? provider.urls?.homepage,
        searchText: [
          id,
          provider.name,
          provider.urls?.homepage,
          provider.urls?.console,
          provider.urls?.docs,
        ]
          .filter(Boolean)
          .join(" "),
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [isDarkMode, providers]);

  return (
    <>
      <theme.Modal
        show={open}
        onHide={handleClose}
        title={t("apiKeys")}
        actions={
          <>
            <theme.Button
              variant="informative"
              onClick={() => {
                setPasswordError(undefined);
                setPasswordMode(encryptedApiKeys ? "change" : "set");
              }}
            >
              {encryptedApiKeys ? t("apiKeysPassword.changePassword") : t("apiKeysPassword.setPassword")}
            </theme.Button>
            <SettingsActionButtons
              onClose={handleClose}
              onDownload={keysEditable ? () => downloadJson("provider_config.json", customHeaders ?? {}) : undefined}
            />
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
            onChange={handleHeaderChange}
            onRemove={handleHeaderRemove}
            disabled={!keysEditable}
            disabledMessage={passwordRequired
              ? t("apiKeysPassword.setPasswordRequired")
              : !keysEditable
                ? t("apiKeysPassword.unlockRequired")
                : undefined}
          />
        </div>
      </theme.Modal>
      {passwordMode ? (
        <ApiKeyPasswordModal
          open={!!passwordMode}
          mode={passwordMode}
          busy={passwordBusy}
          error={passwordError}
          onSubmit={handlePasswordSubmit}
          onClose={() => setPasswordMode(undefined)}
        />
      ) : null}
    </>
  );
};
