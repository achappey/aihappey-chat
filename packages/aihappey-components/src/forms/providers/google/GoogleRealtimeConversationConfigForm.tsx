import React, { ChangeEvent } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";

export type GoogleRealtimeConversationConfig = {
  uses?: number;
  expireTime?: string;
  newSessionExpireTime?: string;
  cameraFrameRate?: number;
  jpegQuality?: number;
  liveConnectConstraints?: {
    model?: string;
    config?: Record<string, any>;
  };
};

const voices = ["Achernar", "Aoede", "Charon", "Fenrir", "Kore", "Leda", "Orus", "Puck", "Zephyr"];

const optionalNumber = (value: string) => {
  if (!String(value ?? "").trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const GoogleRealtimeConversationConfigForm: React.FC<{
  config: GoogleRealtimeConversationConfig;
  updateConfig: (value: GoogleRealtimeConversationConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const constraints = config.liveConnectConstraints ?? {};
  const live = constraints.config ?? {};
  const speech = live.speechConfig ?? {};
  const voice = speech.voiceConfig?.prebuiltVoiceConfig?.voiceName ?? "Kore";
  const vad = live.realtimeInputConfig?.automaticActivityDetection ?? {};
  const compression = live.contextWindowCompression;
  const searchEnabled = Array.isArray(live.tools) && live.tools.some((tool: any) => tool?.googleSearch);

  const updateLive = (patch: Record<string, any>) => updateConfig({
    ...config,
    liveConnectConstraints: {
      ...constraints,
      config: { ...live, ...patch, responseModalities: ["AUDIO"] },
    },
  });

  const setTranscript = (key: "inputAudioTranscription" | "outputAudioTranscription", enabled: boolean) => {
    updateLive({ [key]: enabled ? {} : undefined });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("providers:google.realtimeConversation.title")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>{t("providers:google.realtimeConversation.hint")}</div>
          <theme.Select
            label={t("speechSettings.voice")}
            values={[voice]}
            valueTitle={voice}
            options={voices.map((value) => ({ value, label: value }))}
            onChange={(voiceName: string) => updateLive({
              speechConfig: { ...speech, voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
            })}
          >
            {voices.map((value) => <option key={value} value={value}>{value}</option>)}
          </theme.Select>
          <theme.Switch
            id="google-live-input-transcription"
            label={t("providers:google.realtimeConversation.inputTranscription")}
            checked={live.inputAudioTranscription !== undefined}
            onChange={(enabled) => setTranscript("inputAudioTranscription", enabled)}
          />
          <theme.Switch
            id="google-live-output-transcription"
            label={t("providers:google.realtimeConversation.outputTranscription")}
            checked={live.outputAudioTranscription !== undefined}
            onChange={(enabled) => setTranscript("outputAudioTranscription", enabled)}
          />
          <theme.Switch
            id="google-live-search"
            label={t("providers:google.realtimeConversation.googleSearch")}
            checked={searchEnabled}
            onChange={(enabled) => updateLive({
              tools: enabled
                ? [...(Array.isArray(live.tools) ? live.tools.filter((tool: any) => !tool?.googleSearch) : []), { googleSearch: {} }]
                : (Array.isArray(live.tools) ? live.tools.filter((tool: any) => !tool?.googleSearch) : []),
            })}
          />
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("providers:google.realtimeConversation.turnDetection")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Switch
            id="google-live-automatic-vad"
            label={t("providers:google.realtimeConversation.automaticVad")}
            checked={vad.disabled !== true}
            onChange={(enabled) => updateLive({
              realtimeInputConfig: {
                ...(live.realtimeInputConfig ?? {}),
                automaticActivityDetection: { ...vad, disabled: !enabled },
              },
            })}
          />
          <theme.Input
            id="google-live-prefix-padding"
            type="number"
            min={0}
            step={10}
            label={t("providers:google.realtimeConversation.prefixPaddingMs")}
            value={vad.prefixPaddingMs ?? ""}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateLive({
              realtimeInputConfig: {
                ...(live.realtimeInputConfig ?? {}),
                automaticActivityDetection: { ...vad, prefixPaddingMs: optionalNumber(event.target.value) },
              },
            })}
          />
          <theme.Input
            id="google-live-silence-duration"
            type="number"
            min={100}
            step={50}
            label={t("providers:google.realtimeConversation.silenceDurationMs")}
            value={vad.silenceDurationMs ?? ""}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateLive({
              realtimeInputConfig: {
                ...(live.realtimeInputConfig ?? {}),
                automaticActivityDetection: { ...vad, silenceDurationMs: optionalNumber(event.target.value) },
              },
            })}
          />
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("providers:google.realtimeConversation.sessionManagement")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Switch
            id="google-live-context-compression"
            label={t("providers:google.realtimeConversation.contextCompression")}
            checked={compression !== undefined}
            onChange={(enabled) => updateLive({ contextWindowCompression: enabled ? { slidingWindow: {} } : undefined })}
          />
          <theme.Input
            id="google-live-trigger-tokens"
            type="number"
            min={1}
            step={1000}
            label={t("providers:google.realtimeConversation.triggerTokens")}
            value={compression?.triggerTokens ?? ""}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateLive({
              contextWindowCompression: {
                ...(compression ?? { slidingWindow: {} }),
                triggerTokens: optionalNumber(event.target.value),
              },
            })}
          />
          <theme.Switch
            id="google-live-session-resumption"
            label={t("providers:google.realtimeConversation.sessionResumption")}
            checked={live.sessionResumption !== undefined}
            onChange={(enabled) => updateLive({ sessionResumption: enabled ? {} : undefined })}
          />
          <theme.Input
            id="google-live-token-expiry"
            label={t("providers:google.realtimeConversation.tokenExpiry")}
            value={config.expireTime ?? ""}
            onChange={(value: any) => updateConfig({ ...config, expireTime: String(value?.target?.value ?? value ?? "") || undefined })}
          />
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("providers:google.realtimeConversation.camera")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>{t("providers:google.realtimeConversation.cameraHint")}</div>
          <theme.Input
            id="google-live-camera-fps"
            type="number"
            min={0.1}
            max={1}
            step={0.1}
            label={t("providers:google.realtimeConversation.cameraFps")}
            value={config.cameraFrameRate ?? 1}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateConfig({
              ...config,
              cameraFrameRate: Math.max(0.1, Math.min(1, optionalNumber(event.target.value) ?? 1)),
            })}
          />
          <theme.Input
            id="google-live-jpeg-quality"
            type="number"
            min={0.1}
            max={1}
            step={0.1}
            label={t("providers:google.realtimeConversation.jpegQuality")}
            value={config.jpegQuality ?? 0.8}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateConfig({
              ...config,
              jpegQuality: Math.max(0.1, Math.min(1, optionalNumber(event.target.value) ?? 0.8)),
            })}
          />
        </div>
      </theme.Card>
    </div>
  );
};
