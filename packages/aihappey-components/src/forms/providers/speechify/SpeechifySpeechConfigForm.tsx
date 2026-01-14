import React, { useMemo } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

/**
 * UI config bucket for speech provider metadata: `providerSpeechMetadata.speechify`.
 *
 * IMPORTANT: keys must match backend JSON property names.
 * Mirrors `SpeechifySpeechProviderMetadata`.
 */
export type SpeechifySpeechConfig = {
  /** Required by Speechify. */
  voice_id?: string;

  /** wav | mp3 | ogg | aac | pcm */
  audio_format?: string;

  /** Language tag (e.g. en, fr-FR, de-DE). */
  language?: string;

  /** Wrapper object in Speechify request. */
  options?: {
    loudness_normalization?: boolean;
    text_normalization?: boolean;
  };
};

const DEFAULT_VALUE = "__default__";

const AUDIO_FORMATS = ["wav", "mp3", "ogg", "aac", "pcm"] as const;

const SPEECHIFY_LANGUAGES = [
  // Fully supported
  { label: "English", value: "en" },
  { label: "French", value: "fr-FR" },
  { label: "German", value: "de-DE" },
  { label: "Spanish", value: "es-ES" },
  { label: "Portuguese (Brazil)", value: "pt-BR" },
  { label: "Portuguese (Portugal)", value: "pt-PT" },
  // Beta
  { label: "Arabic", value: "ar-AE" },
  { label: "Danish", value: "da-DK" },
  { label: "Dutch", value: "nl-NL" },
  { label: "Estonian", value: "et-EE" },
  { label: "Finnish", value: "fi-FI" },
  { label: "Greek", value: "el-GR" },
  { label: "Hebrew", value: "he-IL" },
  { label: "Hindi", value: "hi-IN" },
  { label: "Italian", value: "it-IT" },
  { label: "Japanese", value: "ja-JP" },
  { label: "Norwegian", value: "nb-NO" },
  { label: "Polish", value: "pl-PL" },
  { label: "Russian", value: "ru-RU" },
  { label: "Swedish", value: "sv-SE" },
  { label: "Turkish", value: "tr-TR" },
  { label: "Ukrainian", value: "uk-UA" },
  { label: "Vietnamese", value: "vi-VN" },
] as const;

type BoolSelectValue = typeof DEFAULT_VALUE | "true" | "false";

const boolToSelect = (v: boolean | undefined): BoolSelectValue =>
  typeof v === "boolean" ? String(v) as "true" | "false" : DEFAULT_VALUE;

const selectToBool = (v: string | undefined): boolean | undefined => {
  const raw = String(v ?? "");
  if (raw === DEFAULT_VALUE) return undefined;
  if (raw === "true") return true;
  if (raw === "false") return false;
  return undefined;
};

export const SpeechifySpeechConfigForm: React.FC<{
  config: SpeechifySpeechConfig;
  updateConfig: (val: SpeechifySpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const audioFormatOptions = useMemo(
    () => [
      { value: DEFAULT_VALUE, label: t("providerDefault") },
      ...AUDIO_FORMATS.map((f) => ({ value: f, label: f })),
    ],
    [t]
  );

  const knownLanguageValues = useMemo(
    () => SPEECHIFY_LANGUAGES.map((l) => l.value) as readonly string[],
    []
  );

  const isKnownLanguage = (v?: string) =>
    !!v && knownLanguageValues.includes(v);

  // If an unknown value is present, show Provider default but don't clear it
  // until the user explicitly changes the dropdown.
  const languageSelectValue = isKnownLanguage(config?.language)
    ? (config.language as string)
    : DEFAULT_VALUE;

  const languageOptions = useMemo(
    () => [
      { value: DEFAULT_VALUE, label: t("providerDefault") },
      ...SPEECHIFY_LANGUAGES.map((l) => ({
        value: l.value,
        label: `${l.label}`,
      })),
    ],
    [t]
  );

  const booleanOptions = useMemo(
    () => [
      { value: DEFAULT_VALUE, label: t("providerDefault") },
      { value: "true", label: t("enabled") },
      { value: "false", label: t("disabled") },
    ],
    [t]
  );

  const setOptions = (next: SpeechifySpeechConfig["options"]) => {
    const hasAny =
      !!next &&
      (typeof next.loudness_normalization === "boolean" ||
        typeof next.text_normalization === "boolean");
    updateConfig({ ...config, options: hasAny ? next : undefined });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            id="speechify-speech-voice-id"
            required
            label={t("speechSettings.voice")}
            placeholder={t("providers:speechify.speech.voiceIdPlaceholder")}
            value={config?.voice_id ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateConfig({
                ...config,
                voice_id: raw.length ? raw : undefined,
              });
            }}
          />

          <theme.Select
            label={t("providers:speechify.speech.audioFormat")}
            values={[config?.audio_format ?? DEFAULT_VALUE]}
            valueTitle={
              audioFormatOptions.find(
                (o) => o.value === (config?.audio_format ?? DEFAULT_VALUE)
              )?.label
            }
            options={audioFormatOptions}
            onChange={(val: string) => {
              const raw = String(val ?? "");
              updateConfig({
                ...config,
                audio_format: raw === DEFAULT_VALUE ? undefined : raw,
              });
            }}
            style={{ minWidth: 220 }}
          >
            {audioFormatOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={t("language")}
            values={[languageSelectValue]}
            valueTitle={
              languageOptions.find((o) => o.value === languageSelectValue)?.label
            }
            options={languageOptions}
            onChange={(val: string) => {
              const raw = String(val ?? "");
              updateConfig({
                ...config,
                language: raw === DEFAULT_VALUE ? undefined : raw,
              });
            }}
            style={{ minWidth: 220 }}
          >
            {languageOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("providers:speechify.speech.options")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("providers:speechify.speech.loudnessNormalization")}
            hint={t("providers:speechify.speech.loudnessNormalizationHint")}
            values={[boolToSelect(config?.options?.loudness_normalization)]}
            valueTitle={
              booleanOptions.find(
                (o) =>
                  o.value ===
                  boolToSelect(config?.options?.loudness_normalization)
              )?.label
            }
            options={booleanOptions}
            onChange={(val: string) => {
              const next = selectToBool(val);
              setOptions({
                ...(config?.options ?? {}),
                loudness_normalization: next,
              });
            }}
            style={{ minWidth: 220 }}
          >
            {booleanOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={t("providers:speechify.speech.textNormalization")}
            hint={t("providers:speechify.speech.textNormalizationHint")}
            values={[boolToSelect(config?.options?.text_normalization)]}
            valueTitle={
              booleanOptions.find(
                (o) => o.value === boolToSelect(config?.options?.text_normalization)
              )?.label
            }
            options={booleanOptions}
            onChange={(val: string) => {
              const next = selectToBool(val);
              setOptions({
                ...(config?.options ?? {}),
                text_normalization: next,
              });
            }}
            style={{ minWidth: 220 }}
          >
            {booleanOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>
        </div>
      </theme.Card>
    </div>
  );
};

