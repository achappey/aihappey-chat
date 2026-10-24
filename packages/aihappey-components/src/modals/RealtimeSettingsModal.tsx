import React, { useEffect, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { SettingsActionButtons } from "../buttons";
import { AssemblyAIRealtimeConversationConfigForm, GoogleRealtimeConversationConfigForm, OpenAIRealtimeConversationConfigForm, XAIRealtimeConversationConfigForm } from "../forms";
import { useTheme } from "../theme/ThemeContext";

export const normalizeRealtimeSettingsProviderKey = (key: string) =>
  key.toLowerCase() === "spacexai" ? "xai" : key.toLowerCase();

export const hasRealtimeProviderConfig = (key: string) =>
  ["openai", "xai", "assemblyai", "google", "agentphone", "cartesia"].includes(normalizeRealtimeSettingsProviderKey(key));

export const RealtimeProviderConfigForm: React.FC<{
  providerKey: string;
  providerMetadata: Record<string, any>;
  setProviderMetadata: (metadata: Record<string, any>) => void;
}> = ({ providerKey, providerMetadata, setProviderMetadata }) => {
  const theme = useTheme();
  switch (normalizeRealtimeSettingsProviderKey(providerKey)) {
    case "cartesia":
      return (
        <theme.Card size="small" title="Managed agent audio" description="Cartesia managed agents accept microphone audio and DTMF. Dynamic variables are unavailable with browser access tokens.">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <theme.Input id="cartesia-agent-expires" type="number" min={1} max={3600} label="Token lifetime (seconds)" value={providerMetadata.cartesia?.expires_in ?? 600}
              onChange={(value) => setProviderMetadata({ ...providerMetadata, cartesia: { ...providerMetadata.cartesia, expires_in: Number(value) } })} />
            <label htmlFor="cartesia-agent-delivery">Audio delivery</label>
            <select id="cartesia-agent-delivery" value={providerMetadata.cartesia?.audio?.output_delivery ?? "speaking_pace"}
              onChange={(event) => setProviderMetadata({ ...providerMetadata, cartesia: { ...providerMetadata.cartesia, audio: { input_format: "pcm_16000", output_delivery: event.target.value } } })}>
              <option value="speaking_pace">Speaking pace</option><option value="as_available">As available (not supported for background sound)</option>
            </select>
          </div>
        </theme.Card>
      );
    case "openai":
      return (
        <OpenAIRealtimeConversationConfigForm
          config={providerMetadata.openai ?? {}}
          updateConfig={(openai) => setProviderMetadata({
            ...providerMetadata,
            openai,
          })}
        />
      );
    case "xai":
      return (
        <XAIRealtimeConversationConfigForm
          config={providerMetadata.xai ?? providerMetadata.spacexai ?? {}}
          updateConfig={(xai) => setProviderMetadata({
            ...providerMetadata,
            xai,
          })}
        />
      );
    case "assemblyai":
      return (
        <AssemblyAIRealtimeConversationConfigForm
          config={providerMetadata.assemblyai ?? {}}
          updateConfig={(assemblyai) => setProviderMetadata({
            ...providerMetadata,
            assemblyai,
          })}
        />
      );
    case "google":
      return (
        <GoogleRealtimeConversationConfigForm
          config={providerMetadata.google ?? {}}
          updateConfig={(google) => setProviderMetadata({
            ...providerMetadata,
            google,
          })}
        />
      );
    case "agentphone":
      return (
        <theme.Card
          size="small"
          title="AgentPhone web calls"
          description="Uses model ids shaped like agentphone/<agent-id>. The realtime backend must return the AgentPhone web-call access token in the normalized value field."
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <theme.Input
              id="agentphone-realtime-sample-rate"
              type="number"
              min={8000}
              step={1000}
              label="Sample rate"
              value={providerMetadata.agentphone?.sampleRate ?? providerMetadata.agentphone?.session?.sampleRate ?? ""}
              onChange={(sampleRate) => setProviderMetadata({
                ...providerMetadata,
                agentphone: {
                  ...(providerMetadata.agentphone ?? {}),
                  sampleRate: sampleRate ? Number(sampleRate) : undefined,
                },
              })}
            />
            <theme.Input
              id="agentphone-realtime-capture-device-id"
              label="Capture device ID"
              value={providerMetadata.agentphone?.captureDeviceId ?? ""}
              onChange={(captureDeviceId) => setProviderMetadata({
                ...providerMetadata,
                agentphone: {
                  ...(providerMetadata.agentphone ?? {}),
                  captureDeviceId: captureDeviceId || undefined,
                },
              })}
            />
            <theme.Input
              id="agentphone-realtime-playback-device-id"
              label="Playback device ID"
              value={providerMetadata.agentphone?.playbackDeviceId ?? ""}
              onChange={(playbackDeviceId) => setProviderMetadata({
                ...providerMetadata,
                agentphone: {
                  ...(providerMetadata.agentphone ?? {}),
                  playbackDeviceId: playbackDeviceId || undefined,
                },
              })}
            />
            <theme.Switch
              id="agentphone-realtime-raw-audio"
              label="Emit raw audio samples"
              checked={providerMetadata.agentphone?.emitRawAudioSamples ?? providerMetadata.agentphone?.session?.emitRawAudioSamples ?? false}
              onChange={(emitRawAudioSamples) => setProviderMetadata({
                ...providerMetadata,
                agentphone: {
                  ...(providerMetadata.agentphone ?? {}),
                  emitRawAudioSamples,
                },
              })}
            />
          </div>
        </theme.Card>
      );
    default:
      return null;
  }
};

const getDefaultProviderTab = (enabledProviders?: string[]): string => {
  const firstProvider = enabledProviders?.[0];
  const key = typeof firstProvider === "string" ? normalizeRealtimeSettingsProviderKey(firstProvider) : "openai";
  return key === "xai" ? "spacexai" : key;
};

export interface RealtimeSettingsModalProps {
  open: boolean;
  providerMetadata: Record<string, any>;
  setProviderMetadata: (meta: Record<string, any>) => void;
  enabledProviders?: string[];
  resetDefaults?: () => void;
  onClose: () => void;
}

export const RealtimeSettingsModal: React.FC<RealtimeSettingsModalProps> = ({
  open,
  providerMetadata,
  setProviderMetadata,
  enabledProviders = ["OpenAI", "xAI", "AssemblyAI", "Google", "AgentPhone", "Cartesia"],
  resetDefaults,
  onClose,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const normalizedEnabledProviders = enabledProviders.length ? enabledProviders : ["OpenAI", "xAI", "AssemblyAI", "Google", "AgentPhone", "Cartesia"];
  const defaultTab = getDefaultProviderTab(normalizedEnabledProviders);
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    setActiveTab(getDefaultProviderTab(normalizedEnabledProviders));
  }, [normalizedEnabledProviders.join("|")]);

  const close = () => {
    onClose();
    setTimeout(() => setActiveTab(defaultTab), 200);
  };

  return (
    <theme.Modal
      show={open}
      onHide={close}
      title={t("realtime")}
      actions={(
        <SettingsActionButtons
          onClose={close}
          onRestoreDefaults={resetDefaults}
        />
      )}
    >
      <theme.Tabs activeKey={activeTab} onSelect={setActiveTab}>
        {normalizedEnabledProviders.includes("Cartesia") && (
          <theme.Tab eventKey="cartesia" title="Cartesia">
            <RealtimeProviderConfigForm providerKey="cartesia" providerMetadata={providerMetadata} setProviderMetadata={setProviderMetadata} />
          </theme.Tab>
        )}
        {normalizedEnabledProviders.includes("OpenAI") && (
          <theme.Tab eventKey="openai" title="OpenAI">
            <RealtimeProviderConfigForm providerKey="openai" providerMetadata={providerMetadata} setProviderMetadata={setProviderMetadata} />
          </theme.Tab>
        )}
        {(normalizedEnabledProviders.includes("SpaceXAI") || normalizedEnabledProviders.includes("xAI")) && (
          <theme.Tab eventKey="spacexai" title="SpaceXAI">
            <RealtimeProviderConfigForm providerKey="xai" providerMetadata={providerMetadata} setProviderMetadata={setProviderMetadata} />
          </theme.Tab>
        )}
        {normalizedEnabledProviders.includes("AssemblyAI") && (
          <theme.Tab eventKey="assemblyai" title="AssemblyAI">
            <RealtimeProviderConfigForm providerKey="assemblyai" providerMetadata={providerMetadata} setProviderMetadata={setProviderMetadata} />
          </theme.Tab>
        )}
        {normalizedEnabledProviders.includes("Google") && (
          <theme.Tab eventKey="google" title="Google">
            <RealtimeProviderConfigForm providerKey="google" providerMetadata={providerMetadata} setProviderMetadata={setProviderMetadata} />
          </theme.Tab>
        )}
        {normalizedEnabledProviders.includes("AgentPhone") && (
          <theme.Tab eventKey="agentphone" title="AgentPhone">
            <RealtimeProviderConfigForm providerKey="agentphone" providerMetadata={providerMetadata} setProviderMetadata={setProviderMetadata} />
          </theme.Tab>
        )}
      </theme.Tabs>
    </theme.Modal>
  );
};
