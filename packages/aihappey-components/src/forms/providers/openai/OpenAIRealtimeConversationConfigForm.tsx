import React, { ChangeEvent } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";

const DEFAULT_VALUE = "__default__";
const OFF_VALUE = "__off__";

export type OpenAIRealtimeConversationConfig = {
  expires_after?: {
    anchor?: "created_at";
    seconds?: number;
  };
  session?: {
    type?: "realtime";
    output_modalities?: string[];
    max_output_tokens?: number | "inf";
    reasoning?: {
      effort?: "minimal" | "low" | "medium" | "high";
    } | null;
    audio?: {
      input?: {
        format?: { type?: "audio/pcm"; rate?: number } | { type?: "audio/pcma" } | { type?: "audio/pcmu" };
        noise_reduction?: null | { type?: "near_field" | "far_field" };
        transcription?: null | {
          model?: string;
          language?: string;
          prompt?: string;
        };
        turn_detection?: null | {
          type?: "server_vad" | "semantic_vad";
          create_response?: boolean;
          interrupt_response?: boolean;
          idle_timeout_ms?: number;
          prefix_padding_ms?: number;
          silence_duration_ms?: number;
          threshold?: number;
          eagerness?: "low" | "medium" | "high" | "auto";
        };
      };
      output?: {
        format?: { type?: "audio/pcm"; rate?: number } | { type?: "audio/pcma" } | { type?: "audio/pcmu" };
        voice?: string;
        speed?: number;
      };
    };
    tracing?: null | "auto" | Record<string, any>;
    truncation?: "auto" | "disabled";
  };
};

export type OpenAIRealtimeConversationConfigFormProps = {
  config: OpenAIRealtimeConversationConfig;
  updateConfig: (val: OpenAIRealtimeConversationConfig) => void;
};

const OPENAI_REALTIME_VOICES = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "onyx",
  "nova",
  "sage",
  "shimmer",
  "verse",
  "marin",
  "cedar",
] as const;

const formatOptions = [
  { value: DEFAULT_VALUE, label: "Provider default" },
  { value: "audio/pcm", label: "audio/pcm" },
  { value: "audio/pcma", label: "audio/pcma" },
  { value: "audio/pcmu", label: "audio/pcmu" },
];

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

export const OpenAIRealtimeConversationConfigForm: React.FC<OpenAIRealtimeConversationConfigFormProps> = ({
  config,
  updateConfig,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const session = config?.session ?? { type: "realtime" };
  const audioInput = session.audio?.input ?? {};
  const audioOutput = session.audio?.output ?? {};
  const transcription = audioInput.transcription;
  const turnDetection = audioInput.turn_detection;
  const reasoning = session.reasoning;
  const expiresAfter = config?.expires_after ?? {};

  const updateSession = (patch: Partial<NonNullable<OpenAIRealtimeConversationConfig["session"]>>) => {
    updateConfig({
      ...config,
      session: compactObject({
        ...(config.session ?? { type: "realtime" }),
        ...patch,
        type: "realtime",
      }) as NonNullable<OpenAIRealtimeConversationConfig["session"]>,
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

  const inputNoiseReductionValue = audioInput.noise_reduction === undefined
    ? DEFAULT_VALUE
    : audioInput.noise_reduction === null
      ? OFF_VALUE
      : audioInput.noise_reduction?.type ?? DEFAULT_VALUE;
  const transcriptionOn = transcription !== undefined && transcription !== null;
  const turnDetectionOn = turnDetection !== undefined && turnDetection !== null;
  const turnDetectionType = turnDetection && typeof turnDetection === "object"
    ? turnDetection.type ?? "semantic_vad"
    : "semantic_vad";
  const voiceSelectValue = audioOutput.voice ?? DEFAULT_VALUE;
  const inputFormatValue = audioInput.format?.type ?? DEFAULT_VALUE;
  const outputFormatValue = audioOutput.format?.type ?? DEFAULT_VALUE;
  const reasoningValue = reasoning === null ? OFF_VALUE : reasoning?.effort ?? DEFAULT_VALUE;

  const updateFormat = (
    value: string,
    update: (patch: any) => void,
  ) => {
    if (value === DEFAULT_VALUE) {
      update({ format: undefined });
      return;
    }
    update({ format: value === "audio/pcm" ? { type: value, rate: 24000 } : { type: value } });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general") ?? "General"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("speechSettings.voice")}
            values={[voiceSelectValue]}
            valueTitle={voiceSelectValue === DEFAULT_VALUE ? t("providerDefault") : voiceSelectValue}
            options={[{ value: DEFAULT_VALUE, label: t("providerDefault") }, ...OPENAI_REALTIME_VOICES.map((voice) => ({ value: voice, label: voice }))]}
            onChange={(value: string) => {
              const raw = String(value ?? "");
              updateAudioOutput({ voice: raw === DEFAULT_VALUE ? undefined : raw });
            }}
          >
            <option value={DEFAULT_VALUE}>{t("providerDefault")}</option>
            {OPENAI_REALTIME_VOICES.map((voice) => (
              <option key={voice} value={voice}>{voice}</option>
            ))}
          </theme.Select>

          <theme.Input
            id="openai-realtime-output-speed"
            type="number"
            min={0.25}
            max={4}
            step={0.05}
            label="Speed"
            value={audioOutput.speed ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateAudioOutput({ speed: parseOptionalNumber(e.target.value) })}
          />

          <theme.Select
            label="Reasoning effort"
            values={[reasoningValue]}
            valueTitle={selectValueLabel(reasoningValue, t)}
            options={[
              { value: DEFAULT_VALUE, label: t("providerDefault") },
              { value: OFF_VALUE, label: t("off") },
              { value: "minimal", label: "minimal" },
              { value: "low", label: "low" },
              { value: "medium", label: "medium" },
              { value: "high", label: "high" },
            ]}
            onChange={(value: string) => {
              const raw = String(value ?? "");
              updateSession({
                reasoning: raw === DEFAULT_VALUE
                  ? undefined
                  : raw === OFF_VALUE
                    ? null
                    : { effort: raw as any },
              });
            }}
          >
            <option value={DEFAULT_VALUE}>{t("providerDefault")}</option>
            <option value={OFF_VALUE}>{t("off")}</option>
            <option value="minimal">minimal</option>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </theme.Select>

          <theme.Select
            label="Truncation"
            values={[session.truncation ?? DEFAULT_VALUE]}
            valueTitle={session.truncation ?? t("providerDefault")}
            options={[
              { value: DEFAULT_VALUE, label: t("providerDefault") },
              { value: "auto", label: "auto" },
              { value: "disabled", label: "disabled" },
            ]}
            onChange={(value: string) => updateSession({ truncation: value === DEFAULT_VALUE ? undefined : value as any })}
          >
            <option value={DEFAULT_VALUE}>{t("providerDefault")}</option>
            <option value="auto">auto</option>
            <option value="disabled">disabled</option>
          </theme.Select>

          <theme.Input
            id="openai-realtime-token-ttl-seconds"
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

          <theme.Select
            label="Noise reduction"
            values={[inputNoiseReductionValue]}
            valueTitle={selectValueLabel(inputNoiseReductionValue, t)}
            options={[
              { value: DEFAULT_VALUE, label: t("providerDefault") },
              { value: OFF_VALUE, label: t("off") },
              { value: "near_field", label: "near_field" },
              { value: "far_field", label: "far_field" },
            ]}
            onChange={(value: string) => {
              const raw = String(value ?? "");
              updateAudioInput({
                noise_reduction: raw === DEFAULT_VALUE
                  ? undefined
                  : raw === OFF_VALUE
                    ? null
                    : { type: raw as any },
              });
            }}
          >
            <option value={DEFAULT_VALUE}>{t("providerDefault")}</option>
            <option value={OFF_VALUE}>{t("off")}</option>
            <option value="near_field">near_field</option>
            <option value="far_field">far_field</option>
          </theme.Select>
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title="Input transcription"
        headerActions={(
          <theme.Switch
            id="openai-realtime-conversation-transcription-enable"
            checked={transcriptionOn}
            onChange={(enabled) => updateAudioInput({ transcription: enabled ? { model: "gpt-4o-mini-transcribe" } : null })}
          />
        )}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            id="openai-realtime-conversation-transcription-model"
            label="Transcription model"
            disabled={!transcriptionOn}
            value={transcriptionOn ? (transcription as any)?.model ?? "" : ""}
            placeholder="gpt-4o-mini-transcribe"
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateAudioInput({
              transcription: { ...(transcription as any ?? {}), model: cleanString(e.target.value) },
            })}
          />
          <theme.Input
            id="openai-realtime-conversation-transcription-language"
            label={t("language")}
            disabled={!transcriptionOn}
            value={transcriptionOn ? (transcription as any)?.language ?? "" : ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateAudioInput({
              transcription: { ...(transcription as any ?? {}), language: cleanString(e.target.value) },
            })}
          />
          <theme.TextArea
            label="Transcription prompt"
            rows={3}
            value={transcriptionOn ? (transcription as any)?.prompt ?? "" : ""}
            onChange={(value) => {
              if (!transcriptionOn) return;
              updateAudioInput({ transcription: { ...(transcription as any ?? {}), prompt: cleanString(value) } });
            }}
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title="Turn detection"
        headerActions={(
          <theme.Switch
            id="openai-realtime-conversation-turn-detection-enable"
            checked={turnDetectionOn}
            onChange={(enabled) => updateAudioInput({
              turn_detection: enabled ? { type: "semantic_vad", eagerness: "auto", create_response: true, interrupt_response: true } : null,
            })}
          />
        )}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label="Turn detection type"
            disabled={!turnDetectionOn}
            values={[turnDetectionType]}
            valueTitle={turnDetectionType}
            options={[
              { value: "semantic_vad", label: "semantic_vad" },
              { value: "server_vad", label: "server_vad" },
            ]}
            onChange={(value: string) => {
              const raw = String(value ?? "");
              if (raw !== "server_vad" && raw !== "semantic_vad") return;
              updateAudioInput({
                turn_detection: raw === "semantic_vad"
                  ? { ...(turnDetection as any ?? {}), type: "semantic_vad", eagerness: (turnDetection as any)?.eagerness ?? "auto" }
                  : { ...(turnDetection as any ?? {}), type: "server_vad" },
              });
            }}
          >
            <option value="semantic_vad">semantic_vad</option>
            <option value="server_vad">server_vad</option>
          </theme.Select>

          <theme.Switch
            id="openai-realtime-conversation-create-response"
            disabled={!turnDetectionOn}
            checked={!!(turnDetection && typeof turnDetection === "object" && (turnDetection as any).create_response !== false)}
            label="Create response"
            onChange={(enabled) => updateAudioInput({ turn_detection: { ...(turnDetection as any ?? {}), create_response: enabled } })}
          />

          <theme.Switch
            id="openai-realtime-conversation-interrupt-response"
            disabled={!turnDetectionOn}
            checked={!!(turnDetection && typeof turnDetection === "object" && (turnDetection as any).interrupt_response !== false)}
            label="Interrupt response"
            onChange={(enabled) => updateAudioInput({ turn_detection: { ...(turnDetection as any ?? {}), interrupt_response: enabled } })}
          />

          {turnDetectionOn && turnDetectionType === "semantic_vad" ? (
            <theme.Select
              label="Semantic VAD eagerness"
              values={[(turnDetection as any)?.eagerness ?? "auto"]}
              valueTitle={(turnDetection as any)?.eagerness ?? "auto"}
              options={[
                { value: "auto", label: t("auto") },
                { value: "low", label: t("low") },
                { value: "medium", label: t("medium") },
                { value: "high", label: t("high") },
              ]}
              onChange={(value: string) => updateAudioInput({ turn_detection: { ...(turnDetection as any ?? {}), eagerness: value as any } })}
            >
              <option value="auto">{t("auto")}</option>
              <option value="low">{t("low")}</option>
              <option value="medium">{t("medium")}</option>
              <option value="high">{t("high")}</option>
            </theme.Select>
          ) : null}

          {turnDetectionOn && turnDetectionType === "server_vad" ? (
            <>
              <theme.Input
                id="openai-realtime-conversation-vad-threshold"
                type="number"
                step={0.05}
                min={0}
                max={1}
                label="VAD threshold"
                value={(turnDetection as any)?.threshold ?? ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateAudioInput({ turn_detection: { ...(turnDetection as any ?? {}), threshold: parseOptionalNumber(e.target.value) } })}
              />
              <theme.Input
                id="openai-realtime-conversation-vad-prefix-padding"
                type="number"
                step={50}
                min={0}
                label="Prefix padding ms"
                value={(turnDetection as any)?.prefix_padding_ms ?? ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateAudioInput({ turn_detection: { ...(turnDetection as any ?? {}), prefix_padding_ms: parseOptionalNumber(e.target.value) } })}
              />
              <theme.Input
                id="openai-realtime-conversation-vad-silence-duration"
                type="number"
                step={50}
                min={0}
                label="Silence duration ms"
                value={(turnDetection as any)?.silence_duration_ms ?? ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateAudioInput({ turn_detection: { ...(turnDetection as any ?? {}), silence_duration_ms: parseOptionalNumber(e.target.value) } })}
              />
              <theme.Input
                id="openai-realtime-conversation-vad-idle-timeout"
                type="number"
                step={250}
                min={0}
                label="Idle timeout ms"
                value={(turnDetection as any)?.idle_timeout_ms ?? ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateAudioInput({ turn_detection: { ...(turnDetection as any ?? {}), idle_timeout_ms: parseOptionalNumber(e.target.value) } })}
              />
            </>
          ) : null}
        </div>
      </theme.Card>
    </div>
  );
};

