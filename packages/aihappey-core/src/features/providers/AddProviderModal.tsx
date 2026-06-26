import React, { useMemo, useState } from "react";
import { CHAT_ENDPOINT_IDS, normalizeCustomProviderKey, useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { SettingsActionButtons, useTheme } from "aihappey-components";
import type { Provider } from "aihappey-types";

export const AddProviderModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const upsertCustomProvider = useAppStore((s: any) => s.upsertCustomProvider as (key: string, provider: Provider) => void);
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [chatEndpoint, setChatEndpoint] = useState<string>("/v1/chat/completions");
  const [homepage, setHomepage] = useState("");
  const [docs, setDocs] = useState("");
  const [icon, setIcon] = useState("");
  const [error, setError] = useState<string | undefined>();

  const normalizedKey = useMemo(() => normalizeCustomProviderKey(key || name), [key, name]);

  const reset = () => {
    setKey("");
    setName("");
    setApiBaseUrl("");
    setChatEndpoint("/v1/chat/completions");
    setHomepage("");
    setDocs("");
    setIcon("");
    setError(undefined);
  };

  const close = () => {
    reset();
    onClose();
  };

  const save = () => {
    const providerName = name.trim();
    const baseUrl = apiBaseUrl.trim().replace(/\/+$/, "");
    if (!normalizedKey || !providerName || !baseUrl) {
      setError(t("providersPage.addProviderRequired") ?? "Provider key, name, and base URL are required.");
      return;
    }

    try {
      new URL(baseUrl);
    } catch {
      setError(t("providersPage.addProviderInvalidUrl") ?? "Enter a valid provider base URL.");
      return;
    }

    upsertCustomProvider(normalizedKey, {
      name: providerName,
      description: t("providersPage.customProviderDescription") ?? "Custom direct provider",
      apiBaseUrl: baseUrl,
      chatEndpoints: [chatEndpoint],
      category: "model_provider",
      inferenceRegions: ["World"],
      icons: icon.trim() ? [{ src: icon.trim() }] : undefined,
      urls: homepage.trim()
        ? {
          homepage: homepage.trim(),
          docs: docs.trim() || undefined,
        }
        : undefined,
    });
    close();
  };

  return (
    <theme.Modal
      show={open}
      onHide={close}
      title={t("providersPage.addProvider") ?? "Add provider"}
      actions={<SettingsActionButtons onClose={close} />}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <theme.Input label={t("providersPage.providerKey") ?? "Provider key"} value={key} onChange={(event: any) => setKey(event?.target?.value ?? event?.currentTarget?.value ?? event ?? "")} placeholder="my-provider" />
        <theme.Input label={t("name") ?? "Name"} value={name} onChange={(event: any) => setName(event?.target?.value ?? event?.currentTarget?.value ?? event ?? "")} placeholder="My Provider" />
        <theme.Input type="url" label={t("settingsModal.baseUrl") ?? "Base URL"} value={apiBaseUrl} onChange={(event: any) => setApiBaseUrl(event?.target?.value ?? event?.currentTarget?.value ?? event ?? "")} placeholder="https://api.provider.com" />
        <theme.Select
          values={[chatEndpoint]}
          label={t("settingsModal.chatEndpoint") ?? "Chat endpoint"}
          valueTitle={chatEndpoint}
          options={CHAT_ENDPOINT_IDS.filter((endpoint) => endpoint !== "/api/chat").map((endpoint) => ({ value: endpoint, label: endpoint }))}
          onChange={setChatEndpoint}
        />
        <theme.Input type="url" label={t("homepage") ?? "Homepage"} value={homepage} onChange={(event: any) => setHomepage(event?.target?.value ?? event?.currentTarget?.value ?? event ?? "")} />
        <theme.Input type="url" label={t("docs") ?? "Docs"} value={docs} onChange={(event: any) => setDocs(event?.target?.value ?? event?.currentTarget?.value ?? event ?? "")} />
        <theme.Input type="url" label={t("icon") ?? "Icon"} value={icon} onChange={(event: any) => setIcon(event?.target?.value ?? event?.currentTarget?.value ?? event ?? "")} />
        {error ? <div style={{ color: "#d13438", fontSize: 13 }}>{error}</div> : null}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <theme.Button variant="primary" icon="add" onClick={save}>{t("add") ?? "Add"}</theme.Button>
        </div>
      </div>
    </theme.Modal>
  );
};
