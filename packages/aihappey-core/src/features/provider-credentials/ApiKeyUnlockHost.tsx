import { useEffect, useState } from "react";
import { store as appStore, useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { ApiKeyPasswordModal } from "./ApiKeyPasswordModal";
import { decryptApiKeys } from "./apiKeyEncryption";

export const ApiKeyUnlockHost = () => {
  const { t } = useTranslation();
  const encryptedApiKeys = useAppStore((s: any) => s.encryptedApiKeys);
  const apiKeyEncryptionStatus = useAppStore((s: any) => s.apiKeyEncryptionStatus);
  const apiKeySessionPassword = useAppStore((s: any) => s.apiKeySessionPassword);
  const unlockApiKeys = useAppStore((s: any) => s.unlockApiKeys);
  const setApiKeySessionPassword = useAppStore((s: any) => s.setApiKeySessionPassword);
  const [storeHydrated, setStoreHydrated] = useState(() =>
    (appStore as any).persist?.hasHydrated?.() ?? true
  );
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const persistApi = (appStore as any).persist;
    if (!persistApi || persistApi.hasHydrated?.()) {
      setStoreHydrated(true);
      return undefined;
    }

    return persistApi.onFinishHydration?.(() => setStoreHydrated(true));
  }, []);

  useEffect(() => {
    if (
      storeHydrated
      && encryptedApiKeys
      && !apiKeySessionPassword
      && apiKeyEncryptionStatus !== "unlocked"
    ) {
      setOpen(true);
    }
  }, [apiKeyEncryptionStatus, apiKeySessionPassword, encryptedApiKeys, storeHydrated]);

  const handleSubmit = async ({ password }: { password: string }) => {
    if (!encryptedApiKeys) return;
    setBusy(true);
    setError(undefined);
    try {
      const headers = await decryptApiKeys(encryptedApiKeys, password);
      unlockApiKeys(headers);
      setApiKeySessionPassword(password);
      setOpen(false);
    } catch {
      setError(t("apiKeysPassword.invalidPassword"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ApiKeyPasswordModal
      open={open}
      mode="unlock"
      busy={busy}
      error={error}
      onSubmit={handleSubmit}
      onClose={() => undefined}
    />
  );
};

