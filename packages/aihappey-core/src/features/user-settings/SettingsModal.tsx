import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "aihappey-components";
import { useAppStore, type ChatEndpointMode } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { ModelContextSettings } from "./ModelContextSettings";
import { GeneralSettings } from "./GeneralSettings";
import { AiDefaultSettings } from "./AiDefaultSettings";
import { useChatContext } from "../chat/context/ChatContext";
import { StorageSettings } from "./StorageSettings";
import { AppsSettings } from "./AppsSettings";
import { useMultiTheme } from "aihappey-components";
import { SideInferenceAgentsTab } from "../chat-settings/SideInferenceAgentsTab";
import { ProviderKeysModal } from "../provider-credentials/ProviderKeysModal";

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
  const { Modal, Select, Switch, Slider, Input, Button } = theme;
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
  const effectiveChatEndpointMode = useAppStore((s) => s.effectiveChatEndpointMode);
  const configuredBaseUrl = useAppStore((s) => s.configuredBaseUrl);
  const effectiveBaseUrl = useAppStore((s) => s.effectiveBaseUrl);
  const setSelectedChatEndpointMode = useAppStore((s) => s.setSelectedChatEndpointMode);
  const [providerKeysOpen, setProviderKeysOpen] = useState(false);

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
  const activeEndpointMode = isAuthenticatedEndpointConfig ? "default" : effectiveChatEndpointMode;
  const endpointModeOptions = [
    { value: "default", label: `${t("settingsModal.endpointModeDefaultGateway") ?? "Default gateway"} (${configuredChatEndpoint ?? "/api/chat"})` },
    { value: "direct", label: t("settingsModal.endpointModeDirectProvider") ?? "Direct provider" },
  ];
  const baseUrlInputValue = isAuthenticatedEndpointConfig
    ? configuredBaseUrl || effectiveBaseUrl || chat.config.baseUrl || ""
    : configuredBaseUrl ?? chat.config.baseUrl ?? "";
  const effectiveProfileBaseUrl = configuredBaseUrl || chat.config.baseUrl || "";
  const handleEndpointModeChange = (mode: string) => {
    if (isAuthenticatedEndpointConfig) return;
    const nextMode = (mode === "direct" ? "direct" : "default") as ChatEndpointMode;
    setSelectedChatEndpointMode(nextMode === "default" ? undefined : nextMode);
  };

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
                  values={[activeEndpointMode]}
                  label={t("settingsModal.endpointMode") ?? "Endpoint mode"}
                  hint={t("settingsModal.endpointModeHint")
                    ?? "Use the app gateway or connect directly to the provider selected by the model prefix."}
                  valueTitle={endpointModeOptions.find((option) => option.value === activeEndpointMode)?.label}
                  disabled={isAuthenticatedEndpointConfig}
                  options={endpointModeOptions}
                  onChange={handleEndpointModeChange}
                >
                  {endpointModeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>

                {!isAuthenticatedEndpointConfig ? (
                  <div>
                    <Button type="button" variant="subtle" icon="code" onClick={() => setProviderKeysOpen(true)}>
                      {t("apiKeys") ?? "API keys"}
                    </Button>
                  </div>
                ) : null}

                <Input
                  type="url"
                  label={t("settingsModal.baseUrl") ?? "Base URL"}
                  hint={`${t("settingsModal.baseUrlHint") ?? "Override the base API URL used by derived endpoints."} ${t("settingsModal.effectiveBaseUrl") ?? "Effective base URL"}: ${effectiveProfileBaseUrl}`}
                  value={baseUrlInputValue}
                  readOnly={true}
                  disabled={true}
                />

                {isAuthenticatedEndpointConfig ? (
                  <div style={{ opacity: 0.75, fontSize: 13 }}>
                    {t("settingsModal.baseUrlReadOnlyAuthenticated")
                      ?? "This app uses Azure authentication. The API base URL is configured by the server and cannot be changed here."}
                  </div>
                ) : null}

                {activeEndpointMode === "direct" ? (
                  <div style={{ opacity: 0.75, fontSize: 13 }}>
                    {t("settingsModal.endpointDirectProviderAutomaticHint")
                      ?? "Direct provider automatically uses the provider from the selected model, sends provider-compatible model IDs, and applies the matching API key."}
                  </div>
                ) : null}
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
          <ProviderKeysModal open={providerKeysOpen} onClose={() => setProviderKeysOpen(false)} />
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
