import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "aihappey-components";
import { CHAT_ENDPOINT_IDS, useAppStore, type ChatEndpointId } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { ModelContextSettings } from "./ModelContextSettings";
import { GeneralSettings } from "./GeneralSettings";
import { AiDefaultSettings } from "./AiDefaultSettings";
import { useChatContext } from "../chat/context/ChatContext";
import { StorageSettings } from "./StorageSettings";
import { AppsSettings } from "./AppsSettings";
import { useMultiTheme } from "aihappey-components";
import { SideInferenceAgentsTab } from "../chat-settings/SideInferenceAgentsTab";
import {
  CUSTOM_ENDPOINT_PROFILE_ID,
  DEFAULT_ENDPOINT_PROFILE_ID,
  getEndpointProfiles,
  resolveEndpointProfile,
} from "../chat/engine/endpointProfiles";

export interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const formatHeadersForEditor = (headers?: Record<string, string>) =>
  Object.entries(headers ?? {})
    .filter(([key, value]) => key.trim().length > 0 && `${value ?? ""}`.trim().length > 0)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

const parseHeadersFromEditor = (value: string): { headers: Record<string, string>; invalidLine?: number } => {
  const headers: Record<string, string> = {};
  const lines = value.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trim();
    if (!line) continue;

    const separatorIndex = line.indexOf(":");
    if (separatorIndex <= 0) {
      return { headers, invalidLine: index + 1 };
    }

    const key = line.slice(0, separatorIndex).trim();
    const headerValue = line.slice(separatorIndex + 1).trim();
    if (!key) {
      return { headers, invalidLine: index + 1 };
    }

    if (headerValue) {
      headers[key] = headerValue;
    }
  }

  return { headers };
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
}) => {
  const theme = useTheme();
  const { Modal, Select, Switch, Slider, Input } = theme;
  const { t } = useTranslation(); // Uncomment when i18n is ready
  const [activeTab, setActiveTab] = useState("general");
  const multiTheme = useMultiTheme();
  const remoteStorageConnected = useAppStore((s) => s.remoteStorageConnected);
  const enableUserLocation = useAppStore((s) => s.enableUserLocation);
  const setEnableUserLocation = useAppStore((s) => s.setEnableUserLocation);
  const extractExif = useAppStore((s) => s.extractExif);

  // Chat attachment settings
  const convertAttachmentsToText = useAppStore((s) => s.convertAttachmentsToText);
  const setConvertAttachmentsToText = useAppStore(
    (s) => s.setConvertAttachmentsToText
  );
  const sendRawAttachments = useAppStore((s) => s.sendRawAttachments);
  const setSendRawAttachments = useAppStore((s) => s.setSendRawAttachments);
  const maxAttachmentsSize = useAppStore((s) => s.maxAttachmentsSize);
  const setMaxAttachmentsSize = useAppStore((s) => s.setMaxAttachmentsSize);

  const showMessageTemperature = useAppStore((s) => s.showMessageTemperature);
  const showMessageTokens = useAppStore((s) => s.showMessageTokens);
  const agents = useAppStore((s) => s.agents);
  const sideInferenceAgentNames = useAppStore((s) => s.sideInferenceAgentNames);
  const setSideInferenceAgentNames = useAppStore((s) => s.setSideInferenceAgentNames);

  const setShowMessageTemperature = useAppStore((s) => s.setShowMessageTemperature);
  const setShowMessageTokens = useAppStore((s) => s.setShowMessageTokens);
  const configuredChatEndpoint = useAppStore((s) => s.configuredChatEndpoint);
  const selectedEndpointProfileId = useAppStore((s) => s.selectedEndpointProfileId);
  const selectedChatEndpoint = useAppStore((s) => s.selectedChatEndpoint);
  const effectiveChatEndpoint = useAppStore((s) => s.effectiveChatEndpoint);
  const configuredBaseUrl = useAppStore((s) => s.configuredBaseUrl);
  const selectedBaseUrl = useAppStore((s) => s.selectedBaseUrl);
  const effectiveBaseUrl = useAppStore((s) => s.effectiveBaseUrl);
  const customHeaders = useAppStore((s) => s.customHeaders);
  const endpointRawModelIds = useAppStore((s) => s.endpointRawModelIds);
  const endpointProviderMetadataEnabled = useAppStore((s) => s.endpointProviderMetadataEnabled);
  const setSelectedChatEndpoint = useAppStore((s) => s.setSelectedChatEndpoint);
  const setSelectedEndpointProfileId = useAppStore((s) => s.setSelectedEndpointProfileId);
  const setSelectedBaseUrl = useAppStore((s) => s.setSelectedBaseUrl);
  const setEndpointRawModelIds = useAppStore((s) => s.setEndpointRawModelIds);
  const setEndpointProviderMetadataEnabled = useAppStore((s) => s.setEndpointProviderMetadataEnabled);
  const addCustomHeader = useAppStore((s) => s.addCustomHeader);
  const removeCustomHeader = useAppStore((s) => s.removeCustomHeader);
  const [headersDraft, setHeadersDraft] = useState("");
  const [headersError, setHeadersError] = useState<string | undefined>(undefined);

  const ONE_MB = 1024 * 1024;
  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));
  const bytesToMb = (bytes?: number) => {
    if (bytes == null || Number.isNaN(bytes)) return 0;
    return clamp(Math.round(bytes / ONE_MB), 0, 100);
  };
  const mbToBytes = (mb: number) => clamp(mb, 0, 100) * ONE_MB;
  const chat = useChatContext()
  const setRemoteStorageConnected = useAppStore(
    (s) => s.setRemoteStorageConnected
  );
  const setExtractExif = useAppStore(
    (s) => s.setExtractExif
  );
  const isAuthenticatedEndpointConfig = !!chat.config.getAccessToken;
  const endpointProfiles = useMemo(
    () => getEndpointProfiles({ configuredChatEndpoint }),
    [configuredChatEndpoint],
  );
  const visibleEndpointProfiles = useMemo(
    () => isAuthenticatedEndpointConfig
      ? endpointProfiles.filter((profile) => profile.id === DEFAULT_ENDPOINT_PROFILE_ID)
      : endpointProfiles,
    [endpointProfiles, isAuthenticatedEndpointConfig],
  );
  const activeEndpointProfile = useMemo(
    () => resolveEndpointProfile({ selectedEndpointProfileId, selectedBaseUrl, configuredChatEndpoint }),
    [selectedEndpointProfileId, selectedBaseUrl, configuredChatEndpoint],
  );
  const activeEndpointProfileId = activeEndpointProfile?.id ?? DEFAULT_ENDPOINT_PROFILE_ID;
  const isCustomEndpointProfile = activeEndpointProfileId === CUSTOM_ENDPOINT_PROFILE_ID;
  const isProviderEndpointProfile = activeEndpointProfile?.kind === "provider";
  const endpointOptions = [
    ...(activeEndpointProfile?.kind === "default"
      ? [{ value: "", label: `${t("providerDefault") ?? "Default"} (${configuredChatEndpoint ?? "/api/chat"})` }]
      : []),
    ...(activeEndpointProfile?.chatEndpoints ?? CHAT_ENDPOINT_IDS).map((endpoint) => ({ value: endpoint, label: endpoint })),
  ];
  const selectedEndpointValue = activeEndpointProfile?.kind === "default"
    ? selectedChatEndpoint ?? ""
    : selectedChatEndpoint && activeEndpointProfile?.chatEndpoints.includes(selectedChatEndpoint)
      ? selectedChatEndpoint
      : activeEndpointProfile?.chatEndpoints[0] ?? "";
  const baseUrlInputValue = isAuthenticatedEndpointConfig
    ? configuredBaseUrl || effectiveBaseUrl || chat.config.baseUrl || ""
    : isProviderEndpointProfile
      ? activeEndpointProfile?.apiBaseUrl ?? ""
      : isCustomEndpointProfile
        ? selectedBaseUrl ?? configuredBaseUrl ?? chat.config.baseUrl ?? ""
        : configuredBaseUrl ?? chat.config.baseUrl ?? "";
  const effectiveProfileBaseUrl = isProviderEndpointProfile
    ? activeEndpointProfile?.apiBaseUrl ?? ""
    : isCustomEndpointProfile
      ? effectiveBaseUrl || configuredBaseUrl || chat.config.baseUrl || ""
      : configuredBaseUrl || chat.config.baseUrl || "";
  const handleEndpointProfileChange = (profileId: string) => {
    if (isAuthenticatedEndpointConfig) return;

    const nextProfileId = profileId || DEFAULT_ENDPOINT_PROFILE_ID;
    const nextProfile = visibleEndpointProfiles.find((profile) => profile.id === nextProfileId)
      ?? visibleEndpointProfiles[0];

    setSelectedEndpointProfileId(nextProfileId === DEFAULT_ENDPOINT_PROFILE_ID ? undefined : nextProfileId);

    if (nextProfile.kind === "default") {
      setSelectedChatEndpoint(undefined);
      return;
    }

    const nextEndpoint = selectedChatEndpoint && nextProfile.chatEndpoints.includes(selectedChatEndpoint)
      ? selectedChatEndpoint
      : nextProfile.chatEndpoints[0];
    setSelectedChatEndpoint(nextEndpoint);
  };
  const handleBaseUrlChange = (eventOrValue: any) => {
    if (isAuthenticatedEndpointConfig || !isCustomEndpointProfile) return;
    const value = typeof eventOrValue === "string"
      ? eventOrValue
      : eventOrValue?.currentTarget?.value ?? eventOrValue?.target?.value ?? "";

    setSelectedBaseUrl(value || undefined);
  };
  const handleHeadersChange = (value: string) => {
    setHeadersDraft(value);
    if (isAuthenticatedEndpointConfig || !isCustomEndpointProfile) return;

    const parsed = parseHeadersFromEditor(value);
    if (parsed.invalidLine) {
      setHeadersError(`${t("settingsModal.endpointHeadersInvalidLine") ?? "Invalid header line"}: ${parsed.invalidLine}`);
      return;
    }

    setHeadersError(undefined);
    Object.keys(customHeaders ?? {}).forEach((key) => {
      if (!(key in parsed.headers)) {
        removeCustomHeader(key);
      }
    });
    Object.entries(parsed.headers).forEach(([key, headerValue]) => {
      addCustomHeader(key, headerValue);
    });
  };

  useEffect(() => {
    if (!open) return;
    setHeadersDraft(formatHeadersForEditor(customHeaders));
    setHeadersError(undefined);
  }, [open]);

  return (
    <Modal show={open}
      onHide={onClose}
      title={t("settingsModal.title")}>
      <div
        style={{
          borderRadius: 12,
          padding: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column"
          }}
        >
          <theme.Tabs
            activeKey={activeTab}
            vertical={true}
            style={{ minHeight: 260 }}
            onSelect={setActiveTab}
          >
            <theme.Tab
              eventKey="general"
              icon={"settings"}
              title={t("settingsModal.tabGeneral")}
            >
              <GeneralSettings />
            </theme.Tab>

            <theme.Tab
              eventKey="theme"
              icon={"theme"}
              title={t("settingsModal.tabTheme")}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {multiTheme && multiTheme.themes.length > 1 ? (
                  <Select
                    values={[multiTheme.selectedThemeId]}
                    label={t("settingsModal.tabTheme")}
                    valueTitle={multiTheme.selectedTheme?.label}
                    options={multiTheme.themes.map((themeOption) => ({
                      value: themeOption.id,
                      label: themeOption.label,
                    }))}
                    onChange={(themeId: string) => multiTheme.setSelectedThemeId(themeId)}
                  >
                    {multiTheme.themes.map((themeOption) => (
                      <option key={themeOption.id} value={themeOption.id}>
                        {themeOption.label}
                      </option>
                    ))}
                  </Select>
                ) : null}
                <theme.ThemeSettings />
              </div>
            </theme.Tab>

            <theme.Tab
              eventKey="ai"
              icon={"brain"}
              title={t("ai.title")}
            >
              <AiDefaultSettings />
            </theme.Tab>

            <theme.Tab
              eventKey="apps"
              icon={"webApps"}
              title={t("settingsModal.tabApps") ?? t("webApps") ?? "Apps"}
            >
              <AppsSettings />
            </theme.Tab>

            <theme.Tab
              eventKey="mcp"
              icon={"mcpServer"}
              title={t("mcpPage.title")}
            >
              <ModelContextSettings />
            </theme.Tab>

            <theme.Tab
              eventKey="chat"
              icon={"chat"}
              title={t("chat")}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <Switch
                  id="temperature-toggle"
                  checked={!!showMessageTemperature}
                  label={t("settingsModal.showTemperature")}
                  onChange={setShowMessageTemperature}
                />

                <Switch
                  id="tokens-toggle"
                  checked={!!showMessageTokens}
                  label={t("settingsModal.showTokens")}
                  onChange={setShowMessageTokens}
                />

                <SideInferenceAgentsTab
                  agents={agents ?? []}
                  value={sideInferenceAgentNames}
                  onChange={setSideInferenceAgentNames}
                />
              </div>
            </theme.Tab>

            <theme.Tab
              eventKey="endpoints"
              icon={"connector"}
              title={t("settingsModal.tabEndpoints") ?? "Endpoints"}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <Select
                  values={[activeEndpointProfileId]}
                  label={t("settingsModal.endpointProfile") ?? "Endpoint profile"}
                  hint={t("settingsModal.endpointProfileHint")
                    ?? "Choose the configured app gateway, a provider catalog endpoint profile, or a custom override."}
                  valueTitle={activeEndpointProfile?.label ?? "Default gateway"}
                  disabled={isAuthenticatedEndpointConfig}
                  options={visibleEndpointProfiles.map((profile) => ({
                    value: profile.id,
                    label: profile.kind === "default"
                      ? `${profile.label} (${configuredChatEndpoint ?? "/api/chat"})`
                      : profile.kind === "provider"
                        ? `${profile.label} (${profile.apiBaseUrl})`
                        : profile.label,
                  }))}
                  onChange={handleEndpointProfileChange}
                >
                  {visibleEndpointProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.kind === "default"
                        ? `${profile.label} (${configuredChatEndpoint ?? "/api/chat"})`
                        : profile.kind === "provider"
                          ? `${profile.label} (${profile.apiBaseUrl})`
                          : profile.label}
                    </option>
                  ))}
                </Select>

                <Input
                  type="url"
                  label={t("settingsModal.baseUrl") ?? "Base URL"}
                  hint={`${t("settingsModal.baseUrlHint") ?? "Override the base API URL used by derived endpoints."} ${t("settingsModal.effectiveBaseUrl") ?? "Effective base URL"}: ${effectiveProfileBaseUrl}`}
                  value={baseUrlInputValue}
                  readOnly={isAuthenticatedEndpointConfig || !isCustomEndpointProfile}
                  disabled={isAuthenticatedEndpointConfig || !isCustomEndpointProfile}
                  onChange={handleBaseUrlChange}
                />

                {isAuthenticatedEndpointConfig ? (
                  <div style={{ opacity: 0.75, fontSize: 13 }}>
                    {t("settingsModal.baseUrlReadOnlyAuthenticated")
                      ?? "This app uses Azure authentication. The API base URL is configured by the server and cannot be changed here."}
                  </div>
                ) : null}

                {isCustomEndpointProfile ? (
                  <>
                    <theme.TextArea
                      label={t("settingsModal.endpointHeaders") ?? "Headers"}
                      hint={t("settingsModal.endpointHeadersHint")
                        ?? "Optional request headers for endpoints that use this base URL. Enter one header per line as Name: value."}
                      placeholder={t("settingsModal.endpointHeadersPlaceholder")
                        ?? "Authorization: Bearer ...\nx-api-key: ..."}
                      rows={6}
                      value={headersDraft}
                      readOnly={isAuthenticatedEndpointConfig}
                      onChange={handleHeadersChange}
                    />

                    {isAuthenticatedEndpointConfig ? (
                      <div style={{ opacity: 0.75, fontSize: 13 }}>
                        {t("settingsModal.endpointHeadersReadOnlyAuthenticated")
                          ?? "This app uses Azure authentication. Custom endpoint headers cannot be changed here."}
                      </div>
                    ) : headersError ? (
                      <div style={{ color: "#d13438", fontSize: 13 }}>
                        {headersError}
                      </div>
                    ) : null}
                  </>
                ) : null}

                {isCustomEndpointProfile ? (
                  <>
                    <Switch
                      id="endpoint-raw-model-ids-toggle"
                      checked={!!endpointRawModelIds}
                      label={t("settingsModal.endpointRawModelIds") ?? "Send raw model IDs"}
                      onChange={() => setEndpointRawModelIds(!endpointRawModelIds)}
                    />
                    <div style={{ opacity: 0.75, fontSize: 13 }}>
                      {t("settingsModal.endpointRawModelIdsHint")
                        ?? "When enabled, known app provider prefixes are removed from outgoing chat request model IDs for overridden endpoints."}
                    </div>

                    <Switch
                      id="endpoint-provider-metadata-toggle"
                      checked={endpointProviderMetadataEnabled !== false}
                      label={t("settingsModal.endpointProviderMetadata") ?? "Include provider metadata"}
                      onChange={() => setEndpointProviderMetadataEnabled(!(endpointProviderMetadataEnabled !== false))}
                    />
                    <div style={{ opacity: 0.75, fontSize: 13 }}>
                      {t("settingsModal.endpointProviderMetadataHint")
                        ?? "When disabled, provider-specific metadata is omitted from chat requests sent to overridden endpoints."}
                    </div>
                  </>
                ) : isProviderEndpointProfile ? (
                  <div style={{ opacity: 0.75, fontSize: 13 }}>
                    {t("settingsModal.endpointProviderProfileAutomaticHint")
                      ?? "Provider profiles automatically send provider-compatible model IDs and provider metadata from the selected model provider."}
                  </div>
                ) : null}

                <Select
                  values={[selectedEndpointValue]}
                  label={t("settingsModal.chatEndpoint") ?? "Chat endpoint"}
                  hint={`${t("settingsModal.chatEndpointHint") ?? "Choose the chat API shape used when sending messages."} ${t("settingsModal.effectiveChatEndpoint") ?? "Effective endpoint"}: ${selectedEndpointValue || effectiveChatEndpoint}`}
                  valueTitle={selectedEndpointValue || `${t("providerDefault") ?? "Default"} (${configuredChatEndpoint ?? "/api/chat"})`}
                  options={endpointOptions}
                  disabled={isAuthenticatedEndpointConfig}
                  onChange={(value: string) => setSelectedChatEndpoint((value || undefined) as ChatEndpointId | undefined)}
                >
                  {endpointOptions.map((option) => (
                    <option key={option.value || "default"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </theme.Tab>

            <theme.Tab
              eventKey="storage"
              icon={"storage"}
              title={t("storage.title") ?? "Storage"}
            >
              <StorageSettings />
            </theme.Tab>

            <theme.Tab
              eventKey="connectors"
              icon={"connector"}
              title={t("settingsModal.tabConnectors")}
            >
              <div>
                <Switch
                  id="location-toggle"
                  checked={enableUserLocation}
                  label={t("settingsModal.userLocation")}
                  onChange={setEnableUserLocation}
                />

                {chat.config.getAccessToken && <Switch
                  id="remote-storage-toggle"
                  checked={remoteStorageConnected}
                  label={t("settingsModal.remoteStorage")}
                  onChange={() =>
                    setRemoteStorageConnected(!remoteStorageConnected)
                  }
                />}
              </div>
            </theme.Tab>
            <theme.Tab
              eventKey="attachments"
              icon={"attachment"}
              title={t("attachments")}>
              <div>

                <Switch
                  id="convertAttachmentsToText-toggle"
                  checked={convertAttachmentsToText ?? false}
                  label={t("settingsModal.convertAttachmentsToText")
                    ?? "Convert attachments to text"}
                  onChange={() =>
                    setConvertAttachmentsToText(!(convertAttachmentsToText ?? false))
                  }
                />

                <Switch
                  id="sendRawAttachments-toggle"
                  checked={sendRawAttachments ?? false}
                  label={t("settingsModal.sendRawAttachments")
                    ?? "Send raw attachments"}
                  onChange={() =>
                    setSendRawAttachments(!(sendRawAttachments ?? false))
                  }
                />

                <div style={{ marginTop: 12 }}>
                  <Slider
                    id="maxAttachmentsSize-slider"
                    min={0}
                    max={100}
                    step={1}
                    value={bytesToMb(maxAttachmentsSize)}
                    onChange={(mb) => setMaxAttachmentsSize(mbToBytes(mb))}
                    label={t("settingsModal.maxAttachmentsSize")
                      ?? "Max attachments size"}
                    showValue={true}
                    valueFormat={(mb) => `${mb} MB`}
                  />
                </div>

                <h4>{t("images")}</h4>
                <Switch
                  id="setExtractExif-toggle"
                  checked={extractExif}
                  label={t("settingsModal.extractExif")}
                  onChange={() =>
                    setExtractExif(!extractExif)
                  }
                />

              </div>
            </theme.Tab>
          </theme.Tabs>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
