import React, { useEffect, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { SettingsActionButtons } from "../buttons";
import { AssemblyAIRealtimeConversationConfigForm, OpenAIRealtimeConversationConfigForm, XAIRealtimeConversationConfigForm } from "../forms";
import { useTheme } from "../theme/ThemeContext";

const getDefaultProviderTab = (enabledProviders?: string[]): string => {
  const firstProvider = enabledProviders?.[0];
  return typeof firstProvider === "string" ? firstProvider.toLocaleLowerCase() : "openai";
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
  enabledProviders = ["OpenAI", "xAI", "AssemblyAI", "AgentPhone"],
  resetDefaults,
  onClose,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const normalizedEnabledProviders = enabledProviders.length ? enabledProviders : ["OpenAI", "xAI", "AssemblyAI", "AgentPhone"];
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
        {normalizedEnabledProviders.includes("OpenAI") && (
          <theme.Tab eventKey="openai" title="OpenAI">
            <OpenAIRealtimeConversationConfigForm
              config={providerMetadata.openai ?? {}}
              updateConfig={(openai) => setProviderMetadata({
                ...providerMetadata,
                openai,
              })}
            />
          </theme.Tab>
        )}
        {normalizedEnabledProviders.includes("SpaceXAI") && (
          <theme.Tab eventKey="spacexai" title="SpaceXAI">
            <XAIRealtimeConversationConfigForm
              config={providerMetadata.xai ?? {}}
              updateConfig={(xai) => setProviderMetadata({
                ...providerMetadata,
                xai,
              })}
            />
          </theme.Tab>
        )}
        {normalizedEnabledProviders.includes("AssemblyAI") && (
          <theme.Tab eventKey="assemblyai" title="AssemblyAI">
            <AssemblyAIRealtimeConversationConfigForm
              config={providerMetadata.assemblyai ?? {}}
              updateConfig={(assemblyai) => setProviderMetadata({
                ...providerMetadata,
                assemblyai,
              })}
            />
          </theme.Tab>
        )}
        {normalizedEnabledProviders.includes("AgentPhone") && (
          <theme.Tab eventKey="agentphone" title="AgentPhone">
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
          </theme.Tab>
        )}
      </theme.Tabs>
    </theme.Modal>
  );
};

