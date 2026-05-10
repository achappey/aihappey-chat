import React, { ChangeEvent } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";

const DEFAULT_VALUE = "__default__";
const OFF_VALUE = "__off__";

export type XAIRealtimeConversationConfig = {
  expires_after?: {
    anchor?: "created_at";
    seconds?: number;
  };
  session?: {
    voice?: string;
    instructions?: string;
    turn_detection?: null | {
      type?: "server_vad";
      threshold?: number;
      silence_duration_ms?: number;
      prefix_padding_ms?: number;
    };
    audio?: {
      input?: {
        format?: { type?: "audio/pcm"; rate?: number } | { type?: "audio/pcma" } | { type?: "audio/pcmu" };
      };
      output?: {
        format?: { type?: "audio/pcm"; rate?: number } | { type?: "audio/pcma" } | { type?: "audio/pcmu" };
      };
    };
  };
};

export type XAIRealtimeConversationConfigFormProps = {
  config: XAIRealtimeConversationConfig;
  updateConfig: (val: XAIRealtimeConversationConfig) => void;
};

const XAI_REALTIME_VOICES = ["eve", "ara", "rex", "sal", "leo"] as const;

const formatOptions = [
  { value: DEFAULT_VALUE, label: "Provider default" },
  { value: "audio/pcm", label: "audio/pcm" },
  { value: "audio/pcma", label: "audio/pcma" },
  { value: "audio/pcmu", label: "audio/pcmu" },
];

const sampleRateOptions = [8000, 16000, 22050, 24000, 32000, 44100, 48000];

const cleanString = (value: unknown) => {
  const raw = String(value ?? "").trim();
  return raw.length ? raw : undefined;
};

const parseOptionalNumber = (value: string) => {
  if (String(value ?? "").trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const hasAnyValue = (value: any): boolean => {
  if (value === undefined) return false;
  if (value === null) return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value !== "object") return true;
  return Object.values(value).some(hasAnyValue);
};

const compactObject = <T extends Record<string, any>>(value: T): T => {
  const next: Record<string, any> = {};
  for (const [key, child] of Object.entries(value)) {
    if (child === undefined) continue;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      const compacted = compactObject(child);
      if (hasAnyValue(compacted)) next[key] = compacted;
      continue;
    }
    next[key] = child;
  }
  return next as T;
};

const selectValueLabel = (value: string, t: (key: string) => string) => {
  if (value === DEFAULT_VALUE) return t("providerDefault");
  if (value === OFF_VALUE) return t("off");
  return value;
};

export const XAIRealtimeConversationConfigForm: React.FC<XAIRealtimeConversationConfigFormProps> = ({
  config,
  updateConfig,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const session = config?.session ?? {};
  const audioInput = session.audio?.input ?? {};
  const audioOutput = session.audio?.output ?? {};
  const turnDetection = session.turn_detection;
  const expiresAfter = config?.expires_after ?? {};
  const turnDetectionOn = turnDetection !== null;
  const voiceSelectValue = session.voice ?? DEFAULT_VALUE;
  const inputFormatValue = audioInput.format?.type ?? DEFAULT_VALUE;
  const outputFormatValue = audioOutput.format?.type ?? DEFAULT_VALUE;

  const updateSession = (patch: Partial<NonNullable<XAIRealtimeConversationConfig["session"]>>) => {
    updateConfig({
      ...config,
      session: compactObject({
        ...(config.session ?? {}),
        ...patch,
      }) as NonNullable<XAIRealtimeConversationConfig["session"]>,
    });
  };

  const updateAudioInput = (patch: Partial<typeof audioInput>) => {
    updateSession({
      audio: compactObject({
        ...(session.audio ?? {}),
        input: compactObject({
          ...(session.audio?.input ?? {}),
          ...patch,
        }),
      }),
    });
  };

  const updateAudioOutput = (patch: Partial<typeof audioOutput>) => {
    updateSession({
      audio: compactObject({
        ...(session.audio ?? {}),
        output: compactObject({
          ...(session.audio?.output ?? {}),
          ...patch,
        }),
      }),
    });
  };

  const updateFormat = (value: string, update: (patch: any) => void) => {
    if (value === DEFAULT_VALUE) {
      update({ format: undefined });
      return;
    }
    update({ format: value === "audio/pcm" ? { type: value, rate: 24000 } : { type: value } });
  };

  const inputRate = audioInput.format?.type === "audio/pcm" ? audioInput.format.rate ?? 24000 : undefined;
  const outputRate = audioOutput.format?.type === "audio/pcm" ? audioOutput.format.rate ?? 24000 : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general") ?? "General"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("speechSettings.voice")}
            values={[voiceSelectValue]}
            valueTitle={voiceSelectValue === DEFAULT_VALUE ? t("providerDefault") : voiceSelectValue}
            options={[{ value: DEFAULT_VALUE, label: t("providerDefault") }, ...XAI_REALTIME_VOICES.map((voice) => ({ value: voice, label: voice }))]}
            onChange={(value: string) => {
              const raw = String(value ?? "");
              updateSession({ voice: raw === DEFAULT_VALUE ? undefined : raw });
            }}
          >
            <option value={DEFAULT_VALUE}>{t("providerDefault")}</option>
            {XAI_REALTIME_VOICES.map((voice) => (
              <option key={voice} value={voice}>{voice}</option>
            ))}
          </theme.Select>

          <theme.Input
            id="xai-realtime-token-ttl-seconds"
            type="number"
            min={1}
            step={30}
            label="Token TTL seconds"
            value={expiresAfter.seconds ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const seconds = parseOptionalNumber(e.target.value);
              updateConfig({
                ...config,
                expires_after: seconds ? { ...(config.expires_after ?? {}), anchor: "created_at", seconds } : undefined,
              });
            }}
          />
        </div>
      </theme.Card>

      <theme.Card size="small" title="Audio">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label="Input format"
            values={[inputFormatValue]}
            valueTitle={inputFormatValue === DEFAULT_VALUE ? t("providerDefault") : inputFormatValue}
            options={formatOptions.map((option) => option.value === DEFAULT_VALUE ? { ...option, label: t("providerDefault") } : option)}
            onChange={(value: string) => updateFormat(value, updateAudioInput)}
          >
            <option value={DEFAULT_VALUE}>{t("providerDefault")}</option>
            <option value="audio/pcm">audio/pcm</option>
            <option value="audio/pcma">audio/pcma</option>
            <option value="audio/pcmu">audio/pcmu</option>
          </theme.Select>

          {audioInput.format?.type === "audio/pcm" ? (
            <theme.Select
              label="Input sample rate"
              values={[String(inputRate)]}
              valueTitle={String(inputRate)}
              options={sampleRateOptions.map((rate) => ({ value: String(rate), label: String(rate) }))}
              onChange={(value: string) => updateAudioInput({ format: { type: "audio/pcm", rate: Number(value) } })}
            >
              {sampleRateOptions.map((rate) => (
                <option key={rate} value={rate}>{rate}</option>
              ))}
            </theme.Select>
          ) : null}

          <theme.Select
            label="Output format"
            values={[outputFormatValue]}
            valueTitle={outputFormatValue === DEFAULT_VALUE ? t("providerDefault") : outputFormatValue}
            options={formatOptions.map((option) => option.value === DEFAULT_VALUE ? { ...option, label: t("providerDefault") } : option)}
            onChange={(value: string) => updateFormat(value, updateAudioOutput)}
          >
            <option value={DEFAULT_VALUE}>{t("providerDefault")}</option>
            <option value="audio/pcm">audio/pcm</option>
            <option value="audio/pcma">audio/pcma</option>
            <option value="audio/pcmu">audio/pcmu</option>
          </theme.Select>

          {audioOutput.format?.type === "audio/pcm" ? (
            <theme.Select
              label="Output sample rate"
              values={[String(outputRate)]}
              valueTitle={String(outputRate)}
              options={sampleRateOptions.map((rate) => ({ value: String(rate), label: String(rate) }))}
              onChange={(value: string) => updateAudioOutput({ format: { type: "audio/pcm", rate: Number(value) } })}
            >
              {sampleRateOptions.map((rate) => (
                <option key={rate} value={rate}>{rate}</option>
              ))}
            </theme.Select>
          ) : null}
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title="Turn detection"
        headerActions={(
          <theme.Switch
            id="xai-realtime-conversation-turn-detection-enable"
            checked={turnDetectionOn}
            onChange={(enabled) => updateSession({
              turn_detection: enabled ? { type: "server_vad" } : null,
            })}
          />
        )}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label="Turn detection type"
            disabled={!turnDetectionOn}
            values={[turnDetectionOn ? "server_vad" : OFF_VALUE]}
            valueTitle={selectValueLabel(turnDetectionOn ? "server_vad" : OFF_VALUE, t)}
            options={[{ value: "server_vad", label: "server_vad" }]}
            onChange={() => updateSession({ turn_detection: { ...(turnDetection as any ?? {}), type: "server_vad" } })}
          >
            <option value="server_vad">server_vad</option>
          </theme.Select>

          <theme.Input
            id="xai-realtime-conversation-vad-threshold"
            type="number"
            step={0.05}
            min={0.1}
            max={0.9}
            label="VAD threshold"
            disabled={!turnDetectionOn}
            value={(turnDetection as any)?.threshold ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateSession({ turn_detection: { ...(turnDetection as any ?? {}), type: "server_vad", threshold: parseOptionalNumber(e.target.value) } })}
          />
          <theme.Input
            id="xai-realtime-conversation-vad-prefix-padding"
            type="number"
            step={50}
            min={0}
            max={10000}
            label="Prefix padding ms"
            disabled={!turnDetectionOn}
            value={(turnDetection as any)?.prefix_padding_ms ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateSession({ turn_detection: { ...(turnDetection as any ?? {}), type: "server_vad", prefix_padding_ms: parseOptionalNumber(e.target.value) } })}
          />
          <theme.Input
            id="xai-realtime-conversation-vad-silence-duration"
            type="number"
            step={50}
            min={0}
            max={10000}
            label="Silence duration ms"
            disabled={!turnDetectionOn}
            value={(turnDetection as any)?.silence_duration_ms ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateSession({ turn_detection: { ...(turnDetection as any ?? {}), type: "server_vad", silence_duration_ms: parseOptionalNumber(e.target.value) } })}
          />
        </div>
      </theme.Card>

      <theme.Card size="small" title="Instructions override">
        <theme.TextArea
          rows={4}
          value={session.instructions ?? ""}
          onChange={(value) => updateSession({ instructions: cleanString(value) })}
        />
      </theme.Card>
    </div>
  );
};

