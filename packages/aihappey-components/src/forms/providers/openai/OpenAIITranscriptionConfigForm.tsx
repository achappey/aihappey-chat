import React, { ChangeEvent } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import { KnownSpeakersCard } from "./known-speakers";
import type { KnownSpeakerSampleHandlers } from "./known-speakers/KnownSpeakersCard";
import { TemperatureField } from "../../../fields";
import { TimestampGranularitiesForm } from "../../settings/transcriptions/TimestampGranularitiesForm";

export type OpenAIITranscriptionConfig = {
  language?: string;
  prompt?: string;

  /**
   * Controls sampling randomness for transcription.
   * When undefined, provider default is used.
   */
  temperature?: number;

  /**
   * Timestamp granularities to populate.
   * OpenAI requires response_format=verbose_json for these to have effect.
   * When undefined, provider default is used.
   */
  timestamp_granularities?: Array<"word" | "segment">;

  /**
   * Optional list of speaker names used for known speaker diarization.
   * Samples are stored in FILES by name mapping (no IDs stored here).
   */
  known_speaker_names?: string[];

};

type RealtimeExpiresAfter = {
  anchor?: "created_at";
  seconds?: number;
};

type RealtimePcmFormat = {
  type?: "audio/pcm";
  rate?: 24000;
};

type RealtimePcmaFormat = {
  type?: "audio/pcma";
};

type RealtimePcmuFormat = {
  type?: "audio/pcmu";
};

type RealtimeAudioInputFormat = RealtimePcmFormat | RealtimePcmuFormat | RealtimePcmaFormat;

type RealtimeNoiseReduction =
  | null
  | {
    type?: "near_field" | "far_field";
  };

type RealtimeInputTranscription =
  | null
  | {
    language?: string;
    /** model intentionally omitted (backend-controlled) */
    prompt?: string;
  };

type RealtimeTurnDetectionServerVad = {
  type: "server_vad";
  create_response?: boolean;
  interrupt_response?: boolean;
  idle_timeout_ms?: number;
  prefix_padding_ms?: number;
  silence_duration_ms?: number;
  threshold?: number;
};

type RealtimeTurnDetectionSemanticVad = {
  type: "semantic_vad";
  create_response?: boolean;
  interrupt_response?: boolean;
  eagerness?: "low" | "medium" | "high" | "auto";
};

type RealtimeTurnDetection = null | RealtimeTurnDetectionServerVad | RealtimeTurnDetectionSemanticVad;

type RealtimeTranscriptionSession = {
  type: "transcription";
  audio?: {
    input?: {
      format?: RealtimeAudioInputFormat;
      noise_reduction?: RealtimeNoiseReduction;
      transcription?: RealtimeInputTranscription;
    };
  };
  turn_detection?: RealtimeTurnDetection;
  include?: string[];
};

export type OpenAIRealtimeTranscriptionConfig = {
  expires_after?: RealtimeExpiresAfter;
  session?: RealtimeTranscriptionSession;
};

const INCLUDE_LOGPROBS_KEY = "item.input_audio_transcription.logprobs";

export const OpenAIITranscriptionConfigForm: React.FC<{
  config: OpenAIITranscriptionConfig;
  updateConfig: (val: OpenAIITranscriptionConfig) => void;
  realtimeConfig: OpenAIRealtimeTranscriptionConfig;
  updateRealtimeConfig: (val: OpenAIRealtimeTranscriptionConfig) => void;
} & KnownSpeakerSampleHandlers> = ({
  config,
  updateConfig,
  realtimeConfig,
  updateRealtimeConfig,
  getSampleInfo,
  onUploadSample,
  onClearSample,
  onRenameSample,
  onPreviewSample,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const rt = (realtimeConfig ?? {}) as OpenAIRealtimeTranscriptionConfig;
    const session = (rt.session ?? { type: "transcription" }) as RealtimeTranscriptionSession;
    const expiresAfter = rt.expires_after ?? {};
    const audioInput = session.audio?.input ?? {};

    const updateSession = (patch: Partial<RealtimeTranscriptionSession>) => {
      updateRealtimeConfig({
        ...rt,
        session: {
          ...(rt.session ?? { type: "transcription" }),
          ...patch,
          // enforce required constant
          type: "transcription",
        },
      });
    };

    const updateAudioInput = (patch: Partial<NonNullable<NonNullable<RealtimeTranscriptionSession["audio"]>["input"]>>) => {
      updateSession({
        audio: {
          ...(session.audio ?? {}),
          input: {
            ...(session.audio?.input ?? {}),
            ...patch,
          },
        },
      });
    };

    const toggleInclude = (key: string, enabled: boolean) => {
      const current = Array.isArray(session.include) ? session.include : [];
      const next = enabled
        ? Array.from(new Set([...current, key]))
        : current.filter((a) => a !== key);

      updateSession({
        include: next.length ? next : undefined,
      });
    };

    const formatType = audioInput?.format?.type;
    const formatSelectValue = formatType ?? "__default__";
    const noiseReductionValue = audioInput.noise_reduction === undefined
      ? "__default__"
      : audioInput.noise_reduction === null
        ? "__off__"
        : (audioInput.noise_reduction?.type ?? "__default__");

    const transcriptionOn = audioInput.transcription !== undefined && audioInput.transcription !== null;
    const turnDetectionOn = session.turn_detection !== undefined && session.turn_detection !== null;
    const turnDetectionType = (session.turn_detection && session.turn_detection !== null)
      ? session.turn_detection.type
      : "server_vad";

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <theme.Card size="small" title={t("general")}>
          <div>
            <theme.Input
              label={t("language")}
              placeholder={t("providers:openai.transcriptionLanguagePlaceholder")}
              value={config?.language ?? ""}
              onChange={(val) =>
                updateConfig({
                  ...config,
                  language: val.target.value && val.target.value.length > 0 ? val.target.value : undefined,
                })
              }
            >
            </theme.Input>

            <TemperatureField
              value={config?.temperature ?? 0}
              onChange={(temperature) =>
                updateConfig({
                  ...config,
                  temperature,
                })
              }
            />

            <theme.TextArea
              label={t("providers:openai.prompt")}
              placeholder={t(
                "providers:openai.speechPromptPlaceholder"
              )}
              rows={5}
              value={config?.prompt ?? ""}
              onChange={(value) =>
                updateConfig({
                  ...config,
                  prompt: value,
                })
              }
            />


          </div>
        </theme.Card>


        <TimestampGranularitiesForm
          idPrefix="openai-transcription-timestamp"
          value={config?.timestamp_granularities}
          onChange={(timestamp_granularities) =>
            updateConfig({
              ...config,
              timestamp_granularities,
            })
          }
        />

        <KnownSpeakersCard
          config={config}
          updateConfig={updateConfig}
          getSampleInfo={getSampleInfo}
          onUploadSample={onUploadSample}
          onClearSample={onClearSample}
          onRenameSample={onRenameSample}
          onPreviewSample={onPreviewSample}
        />


        <theme.Card
          size="small"
          title={t("realtime")}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <theme.Select
              label={t("providers:openai.realtimeNoiseReduction")}
              values={[noiseReductionValue]}
              valueTitle={
                noiseReductionValue === "__default__"
                  ? t("providerDefault")
                  : noiseReductionValue === "__off__"
                    ? t("off")
                    : noiseReductionValue
              }
              options={[
                { value: "__default__", label: t("providerDefault") },
                { value: "__off__", label: t("off") },
                { value: "near_field", label: "near_field" },
                { value: "far_field", label: "far_field" },
              ]}
              onChange={(val: string) => {
                const raw = String(val ?? "");
                if (raw === "__default__") {
                  updateAudioInput({ noise_reduction: undefined });
                  return;
                }
                if (raw === "__off__") {
                  updateAudioInput({ noise_reduction: null });
                  return;
                }
                if (raw === "near_field" || raw === "far_field") {
                  updateAudioInput({ noise_reduction: { type: raw } });
                }
              }}
              style={{ minWidth: 220 }}
            >
              <option value="__default__">{t("providerDefault")}</option>
              <option value="__off__">{t("off")}</option>
              <option value="near_field">near_field</option>
              <option value="far_field">far_field</option>
            </theme.Select>


            <theme.Input
              label={t("language")}
              placeholder={t("providers:openai.transcriptionLanguagePlaceholder")}
              disabled={!transcriptionOn}
              value={transcriptionOn ? (audioInput.transcription as any)?.language ?? "" : ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const raw = String(e.target.value ?? "").trim();
                updateAudioInput({
                  transcription: {
                    ...(typeof audioInput.transcription === "object"
                      && audioInput.transcription ? audioInput.transcription : {}),
                    language: raw.length ? raw : undefined,
                  },
                });
              }}
            />

            <theme.TextArea
              label={t("providers:openai.realtimeTranscriptionPrompt")}
              placeholder={t("providers:openai.speechPromptPlaceholder")}
              rows={3}
              value={transcriptionOn ? (audioInput.transcription as any)?.prompt ?? "" : ""}
              onChange={(value) => {
                if (!transcriptionOn) return;
                const raw = String(value ?? "");
                updateAudioInput({
                  transcription: {
                    ...(typeof audioInput.transcription === "object" && audioInput.transcription ? audioInput.transcription : {}),
                    prompt: raw.length ? raw : undefined,
                  },
                });
              }}
            />

            <theme.Card
              title={t("providers:openai.realtimeTurnDetection")}
              headerActions={
                <theme.Switch
                  id="openai-realtime-turn-detection-enable"
                  checked={turnDetectionOn}
                  onChange={(enabled) => {
                    updateSession({
                      turn_detection: enabled ? { type: "server_vad" } : null,
                    });
                  }}
                />
              }
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <theme.Select
                  label={t("providers:openai.realtimeTurnDetectionType")}
                  disabled={!turnDetectionOn}
                  values={[turnDetectionType]}
                  valueTitle={turnDetectionType}
                  options={[
                    { value: "server_vad", label: "server_vad" },
                    { value: "semantic_vad", label: "semantic_vad" },
                  ]}
                  onChange={(val: string) => {
                    const raw = String(val ?? "");
                    if (raw !== "server_vad" && raw !== "semantic_vad") return;

                    const current = session.turn_detection;
                    const base = (current && current !== null && typeof current === "object") ? current : undefined;
                    if (raw === "server_vad") {
                      updateSession({
                        turn_detection: {
                          type: "server_vad",
                          create_response: (base as any)?.create_response,
                          interrupt_response: (base as any)?.interrupt_response,
                        },
                      });
                    } else {
                      updateSession({
                        turn_detection: {
                          type: "semantic_vad",
                          create_response: (base as any)?.create_response,
                          interrupt_response: (base as any)?.interrupt_response,
                          eagerness: (base as any)?.eagerness ?? "auto",
                        },
                      });
                    }
                  }}
                  style={{ minWidth: 220 }}
                >
                  <option value="server_vad">server_vad</option>
                  <option value="semantic_vad">semantic_vad</option>
                </theme.Select>

                <theme.Switch
                  id="openai-realtime-turn-create-response"
                  disabled={!turnDetectionOn}
                  checked={
                    !!(session.turn_detection && session.turn_detection !== null && (session.turn_detection as any).create_response !== false)
                  }
                  label={t("providers:openai.realtimeTurnCreateResponse")}
                  onChange={(enabled) => {
                    if (!turnDetectionOn) return;
                    updateSession({
                      turn_detection: {
                        ...(session.turn_detection as any),
                        create_response: enabled,
                      },
                    });
                  }}
                />

                <theme.Switch
                  id="openai-realtime-turn-interrupt-response"
                  disabled={!turnDetectionOn}
                  checked={
                    !!(session.turn_detection && session.turn_detection !== null && (session.turn_detection as any).interrupt_response !== false)
                  }
                  label={t("providers:openai.realtimeTurnInterruptResponse")}
                  onChange={(enabled) => {
                    if (!turnDetectionOn) return;
                    updateSession({
                      turn_detection: {
                        ...(session.turn_detection as any),
                        interrupt_response: enabled,
                      },
                    });
                  }}
                />

                {turnDetectionOn && turnDetectionType === "server_vad" && (
                  <>
                    <theme.Input
                      id="openai-realtime-vad-threshold"
                      type="number"
                      step={0.05}
                      min={0}
                      max={1}
                      label={t("providers:openai.realtimeVadThreshold")}
                      value={(session.turn_detection as any)?.threshold ?? ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const raw = e.target.value;
                        updateSession({
                          turn_detection: {
                            ...(session.turn_detection as any),
                            threshold: raw ? Number(raw) : undefined,
                          },
                        });
                      }}
                    />

                    <theme.Input
                      id="openai-realtime-vad-prefix-padding"
                      type="number"
                      step={50}
                      min={0}
                      label={t("providers:openai.realtimeVadPrefixPaddingMs")}
                      value={(session.turn_detection as any)?.prefix_padding_ms ?? ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const raw = e.target.value;
                        updateSession({
                          turn_detection: {
                            ...(session.turn_detection as any),
                            prefix_padding_ms: raw ? Number(raw) : undefined,
                          },
                        });
                      }}
                    />

                    <theme.Input
                      id="openai-realtime-vad-silence-duration"
                      type="number"
                      step={50}
                      min={0}
                      label={t("providers:openai.realtimeVadSilenceDurationMs")}
                      value={(session.turn_detection as any)?.silence_duration_ms ?? ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const raw = e.target.value;
                        updateSession({
                          turn_detection: {
                            ...(session.turn_detection as any),
                            silence_duration_ms: raw ? Number(raw) : undefined,
                          },
                        });
                      }}
                    />

                    <theme.Input
                      id="openai-realtime-vad-idle-timeout"
                      type="number"
                      step={250}
                      min={0}
                      label={t("providers:openai.realtimeVadIdleTimeoutMs")}
                      value={(session.turn_detection as any)?.idle_timeout_ms ?? ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const raw = e.target.value;
                        updateSession({
                          turn_detection: {
                            ...(session.turn_detection as any),
                            idle_timeout_ms: raw ? Number(raw) : undefined,
                          },
                        });
                      }}
                    />
                  </>
                )}

                {turnDetectionOn && turnDetectionType === "semantic_vad" && (
                  <theme.Select
                    label={t("providers:openai.realtimeSemanticEagerness")}
                    disabled={!turnDetectionOn}
                    values={[(session.turn_detection as any)?.eagerness ?? "auto"]}
                    valueTitle={(session.turn_detection as any)?.eagerness ?? "auto"}
                    options={[
                      { value: "auto", label: t("auto") },
                      { value: "low", label: t("low") },
                      { value: "medium", label: t("medium") },
                      { value: "high", label: t("high") },
                    ]}
                    onChange={(val: string) => {
                      const raw = String(val ?? "auto");
                      updateSession({
                        turn_detection: {
                          ...(session.turn_detection as any),
                          eagerness: (raw as any) || "auto",
                        },
                      });
                    }}
                    style={{ minWidth: 220 }}
                  >
                    <option value="auto">{t("auto")}</option>
                    <option value="low">{t("low")}</option>
                    <option value="medium">{t("medium")}</option>
                    <option value="high">{t("high")}</option>
                  </theme.Select>
                )}
              </div>
            </theme.Card>

            <theme.Switch
              id="openai-realtime-include-logprobs"
              disabled={!transcriptionOn}
              checked={Array.isArray(session.include) && session.include.includes(INCLUDE_LOGPROBS_KEY)}
              label={t("providers:openai.realtimeIncludeLogprobs")}
              onChange={(enabled) => toggleInclude(INCLUDE_LOGPROBS_KEY, !!enabled)}
            />

            <theme.Input
              id="openai-realtime-token-ttl-seconds"
              type="number"
              min={1}
              step={30}
              label={t("providers:openai.realtimeTokenTtlSeconds")}
              value={expiresAfter.seconds ?? ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const raw = e.target.value;
                updateRealtimeConfig({
                  ...rt,
                  expires_after: {
                    ...(rt.expires_after ?? {}),
                    seconds: raw ? Number(raw) : undefined,
                  },
                });
              }}
            />
          </div>
        </theme.Card>



      </div>
    );
  };
