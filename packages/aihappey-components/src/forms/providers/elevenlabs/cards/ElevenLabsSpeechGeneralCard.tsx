import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { ElevenLabsSpeechConfig } from "../ElevenLabsSpeechConfigForm";

export const ElevenLabsSpeechGeneralCard: React.FC<{
  config: ElevenLabsSpeechConfig;
  updateConfig: (val: ElevenLabsSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const DEFAULT_VALUE = "__default__";

  // Allowlist from ElevenLabs docs.
  const ALLOWED_OUTPUT_FORMATS = [
    "mp3_22050_32",
    "mp3_24000_48",
    "mp3_44100_32",
    "mp3_44100_64",
    "mp3_44100_96",
    "mp3_44100_128",
    "mp3_44100_192",
    "pcm_8000",
    "pcm_16000",
    "pcm_22050",
    "pcm_24000",
    "pcm_32000",
    "pcm_44100",
    "pcm_48000",
    "ulaw_8000",
    "alaw_8000",
    "opus_48000_32",
    "opus_48000_64",
    "opus_48000_96",
    "opus_48000_128",
    "opus_48000_192",
  ] as const;

  const isAllowedOutputFormat = (v?: string) =>
    !!v && (ALLOWED_OUTPUT_FORMATS as readonly string[]).includes(v);

  // If an unsupported value is already present, keep it in config untouched,
  // but show Provider default in the select until the user changes it.
  const outputFormatSelectValue = !config?.output_format
    ? DEFAULT_VALUE
    : isAllowedOutputFormat(config.output_format)
      ? (config.output_format as string)
      : DEFAULT_VALUE;

  const outputFormatOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...ALLOWED_OUTPUT_FORMATS.map((v) => ({ value: v, label: v })),
  ];

  return (
    <theme.Card size="small" title={t("general")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Input
          label={t("speechSettings.voice")}
          placeholder="ex. JBFqnCBsd6RMkjVDRZzb"
          value={config?.voice ?? ""}
          onChange={(e: any) => {
            const raw = String(e?.target?.value ?? "").trim();
            updateConfig({ ...config, voice: raw ? raw : undefined });
          }}
        />

        <theme.Select
          label={t("outputFormat")}
          values={[outputFormatSelectValue]}
          valueTitle={
            outputFormatOptions.find((o) => o.value === outputFormatSelectValue)?.
              label
          }
          options={outputFormatOptions}
          onChange={(val: string) => {
            const raw = String(val ?? "");

            if (raw === DEFAULT_VALUE) {
              updateConfig({ ...config, output_format: undefined });
              return;
            }

            updateConfig({ ...config, output_format: raw });
          }}
          style={{ minWidth: 220 }}
        >
          {outputFormatOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>

        <theme.Switch
          id="elevenlabs-speech-enable-logging"
          label={t("providers:elevenlabs.enableLogging")}
          checked={config?.enable_logging ?? true}
          onChange={(enabled) => updateConfig({ ...config, enable_logging: enabled })}
        />

        <theme.Input
          id="elevenlabs-speech-seed"
          type="number"
          min={0}
          max={4294967295}
          step={1}
          label={t("providers:elevenlabs.seed")}
          value={config?.seed ?? ""}
          onChange={(e: any) => {
            const raw = String(e?.target?.value ?? "").trim();
            updateConfig({
              ...config,
              seed: raw.length ? Number(raw) : undefined,
            });
          }}
        />
      </div>
    </theme.Card>
  );
};

