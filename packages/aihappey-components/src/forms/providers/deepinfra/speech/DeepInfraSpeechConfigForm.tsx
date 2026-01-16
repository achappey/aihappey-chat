import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import {
  DeepInfraCanopyLabsSpeechCardForm,
  DeepInfraHexgradSpeechCardForm,
  DeepInfraResembleAISpeechCardForm,
  DeepInfraSesameSpeechCardForm,
  DeepInfraZyphraSpeechCardForm,
} from "./cards";

/**
 * UI config bucket for speech provider metadata: `providerSpeechMetadata.deepinfra`.
 *
 * IMPORTANT: keys must match backend JSON property names.
 * Mirrors `DeepInfraSpeechProviderMetadata`.
 */
export type DeepInfraResembleAISpeechConfig = {
  /** mp3 | opus | flac | wav | pcm */
  response_format?: string;

  /** Voice ID created on DeepInfra. */
  voice_id?: string;

  /** Language code for multilingual model (e.g., "en", "fr", "zh"). */
  language_id?: string;

  /** 0..1 */
  exaggeration?: number;

  /** 0..1 */
  cfg?: number;

  /** 0..2 */
  temperature?: number;

  /** 0..2147483647 */
  seed?: number;

  /** 0..1 */
  top_p?: number;

  /** 0..1 */
  min_p?: number;

  /** 0..5 */
  repetition_penalty?: number;

  /** 0..1000 */
  top_k?: number;

};

export type DeepInfraSesameSpeechConfig = {
  /** mp3 | opus | flac | wav | pcm */
  response_format?: string;

  /** conversational_a | conversational_b | read_speech_a | read_speech_b | read_speech_c | read_speech_d | none */
  preset_voice?: string;

  /** 0..2 */
  temperature?: number;

  /** Speaker audio for the speech to be synthesized. */
  speaker_audio?: string;

  /** Transcript of the given speaker audio. */
  speaker_transcript?: string;

  /** 0..2147483647 */
  max_audio_length_ms?: number;
};

export type DeepInfraZyphraSpeechConfig = {
  /** mp3 | opus | flac | wav | pcm */
  output_format?: string;

  /** american_female | american_male | british_female | british_male | random */
  preset_voice?: string;

  /** Voice ID to use for the speech. Either preset_voice or voice_id should be provided */
  voice_id?: string;

  /** 5..35 */
  speaker_rate?: number;

  /** 0..2147483647 */
  seed?: number;

  /** en-us | fr-fr | de | ja | ko | cmn */
  language?: string;
};

export type DeepInfraCanopyLabsSpeechConfig = {
  /** mp3 | opus | flac | wav | pcm */
  response_format?: string;

  /** tara | leah | jess | leo | dan | mia | zac */
  voice?: string;

  /** 0..2 */
  temperature?: number;

  /** 0..1 */
  top_p?: number;

  /** 1..4096 */
  max_tokens?: number;

  /** 0.. */
  repetition_penalty?: number;
};

export type DeepInfraHexgradSpeechConfig = {
  /** mp3 | opus | flac | wav | pcm */
  output_format?: string;

  /** Preset voice name list. */
  preset_voice?: string[];

  /** 0.25..4 */
  speed?: number;

  /** Return timestamps for tokens. */
  return_timestamps?: boolean;

  /** Sample rate for the output audio. */
  sample_rate?: number;

  /** Minimum number of tokens for the output. */
  target_min_tokens?: number;

  /** Maximum number of tokens for the output. */
  target_max_tokens?: number;

  /** Absolute maximum number of tokens for the output. */
  absolute_max_tokens?: number;
};

export type DeepInfraSpeechConfig = {
  /** Allowed values: "default" | "priority" (while `undefined` means provider default). */
  service_tier?: string;
  resembleai?: DeepInfraResembleAISpeechConfig;
  sesame?: DeepInfraSesameSpeechConfig;
  zyphra?: DeepInfraZyphraSpeechConfig;
  canopylabs?: DeepInfraCanopyLabsSpeechConfig;
  hexgrad?: DeepInfraHexgradSpeechConfig;
};

const DEFAULT_VALUE = "__default__";

export const DeepInfraSpeechConfigForm: React.FC<{
  config: DeepInfraSpeechConfig;
  updateConfig: (val: DeepInfraSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const serviceTierValue = config?.service_tier === "priority" ? "priority" : DEFAULT_VALUE;

  const serviceTierOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    { value: "priority", label: t("priority") },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("providers:deepinfra.speech.serviceTier")}
            values={[serviceTierValue]}
            valueTitle={
              serviceTierOptions.find((o) => o.value === serviceTierValue)?.label ?? ""
            }
            options={serviceTierOptions}
            onChange={(val: string) => {
              const raw = String(val ?? "");
              updateConfig({
                ...config,
                service_tier: raw === DEFAULT_VALUE ? undefined : raw,
              });
            }}
            style={{ minWidth: 220 }}
          >
            {serviceTierOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

        </div>
      </theme.Card>

      <DeepInfraCanopyLabsSpeechCardForm config={config} updateConfig={updateConfig} />
      <DeepInfraHexgradSpeechCardForm config={config} updateConfig={updateConfig} />
      <DeepInfraResembleAISpeechCardForm config={config} updateConfig={updateConfig} />
      <DeepInfraSesameSpeechCardForm config={config} updateConfig={updateConfig} />
      <DeepInfraZyphraSpeechCardForm config={config} updateConfig={updateConfig} />
    </div>
  );
};
