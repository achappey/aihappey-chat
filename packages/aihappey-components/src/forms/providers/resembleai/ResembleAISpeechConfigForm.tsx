import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

/**
 * UI config bucket for speech provider metadata: `providerSpeechMetadata.resembleai`.
 *
 * IMPORTANT: keys must match backend JSON property names.
 * Mirrors `ResembleAISpeechProviderMetadata`.
 */
export type ResembleAISpeechConfig = {
  /** Required by Resemble. */
  voice_uuid?: string;

  /** Optional project UUID to store the generated clip. */
  project_uuid?: string;

  /** Optional title for the generated clip. */
  title?: string;

  /** MULAW | PCM_16 | PCM_24 | PCM_32 */
  precision?: string;

  /** wav | mp3 */
  output_format?: string;

  /** 8000 | 16000 | 22050 | 32000 | 44100 | 48000 */
  sample_rate?: number;

  /** Enable HD synthesis with small latency trade-off. */
  use_hd?: boolean;
};

const DEFAULT_VALUE = "__default__";

const PRECISIONS = ["MULAW", "PCM_16", "PCM_24", "PCM_32"] as const;
const OUTPUT_FORMATS = ["wav", "mp3"] as const;
const SAMPLE_RATES = [8000, 16000, 22050, 32000, 44100, 48000] as const;

export const ResembleAISpeechConfigForm: React.FC<{
  config: ResembleAISpeechConfig;
  updateConfig: (val: ResembleAISpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const precisionOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...PRECISIONS.map((p) => ({ value: p, label: p })),
  ];

  const outputFormatOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...OUTPUT_FORMATS.map((f) => ({ value: f, label: f })),
  ];

  const sampleRateOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...SAMPLE_RATES.map((sr) => ({ value: String(sr), label: String(sr) })),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            id="resembleai-speech-voice-uuid"
            required
            label={t("providers:resembleai.speech.voiceUuid")}
            placeholder={t("providers:resembleai.speech.voiceUuidPlaceholder")}
            value={config?.voice_uuid ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateConfig({
                ...config,
                voice_uuid: raw.length ? raw : undefined,
              });
            }}
          />

          <theme.Input
            id="resembleai-speech-project-uuid"
            label={t("providers:resembleai.speech.projectUuid")}
            hint={t("providers:resembleai.speech.projectUuidHint")}
            placeholder={t("providers:resembleai.speech.projectUuidPlaceholder")}
            value={config?.project_uuid ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateConfig({
                ...config,
                project_uuid: raw.length ? raw : undefined,
              });
            }}
          />

          <theme.Input
            id="resembleai-speech-title"
            label={t("providers:resembleai.speech.title")}
            hint={t("providers:resembleai.speech.titleHint")}
            placeholder={t("providers:resembleai.speech.titlePlaceholder")}
            value={config?.title ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateConfig({
                ...config,
                title: raw.length ? raw : undefined,
              });
            }}
          />

          <theme.Select
            label={t("outputFormat")}
            values={[config?.output_format ?? DEFAULT_VALUE]}
            valueTitle={
              outputFormatOptions.find(
                (o) => o.value === (config?.output_format ?? DEFAULT_VALUE)
              )?.label
            }
            options={outputFormatOptions}
            onChange={(val: string) => {
              const raw = String(val ?? "");
              updateConfig({
                ...config,
                output_format: raw === DEFAULT_VALUE ? undefined : raw,
              });
            }}
            style={{ minWidth: 220 }}
          >
            {outputFormatOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={t("providers:resembleai.speech.precision")}
            values={[config?.precision ?? DEFAULT_VALUE]}
            valueTitle={
              precisionOptions.find((o) => o.value === (config?.precision ?? DEFAULT_VALUE))
                ?.label
            }
            options={precisionOptions}
            onChange={(val: string) => {
              const raw = String(val ?? "");
              updateConfig({
                ...config,
                precision: raw === DEFAULT_VALUE ? undefined : raw,
              });
            }}
            style={{ minWidth: 220 }}
          >
            {precisionOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={t("speechSettings.sampleRate")}
            values={[
              typeof config?.sample_rate === "number"
                ? String(config.sample_rate)
                : DEFAULT_VALUE,
            ]}
            valueTitle={
              sampleRateOptions.find(
                (o) =>
                  o.value ===
                  (typeof config?.sample_rate === "number"
                    ? String(config.sample_rate)
                    : DEFAULT_VALUE)
              )?.label
            }
            options={sampleRateOptions}
            onChange={(val: string) => {
              const raw = String(val ?? "");
              if (raw === DEFAULT_VALUE) {
                updateConfig({ ...config, sample_rate: undefined });
                return;
              }
              const next = Number(raw);
              updateConfig({ ...config, sample_rate: Number.isFinite(next) ? next : undefined });
            }}
            style={{ minWidth: 220 }}
          >
            {sampleRateOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Switch
            id="resembleai-speech-use-hd"
            label={t("providers:resembleai.speech.useHd")}
            checked={config?.use_hd ?? false}
            onChange={(enabled) => updateConfig({ ...config, use_hd: enabled })}
          />
        </div>
      </theme.Card>
    </div>
  );
};

