import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export type SpeechSettings = {
  voice?: string;
  outputFormat?: string;
  instructions?: string;
  speed?: number;
  language?: string;
};

export type SpeechSettingsFormProps = {
  value: SpeechSettings;
  onChange: (next: SpeechSettings) => void;
};

export const SpeechSettingsForm: React.FC<SpeechSettingsFormProps> = ({
  value,
  onChange,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const outputFormatOptions = [
    { value: "auto", label: t("providerDefault") },
    { value: "mp3", label: "MP3" },
    { value: "wav", label: "WAV" },
    { value: "opus", label: "Opus" },
    { value: "aac", label: "AAC" },
    { value: "flac", label: "FLAC" },
    { value: "pcm", label: "PCM" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}>
        <div>
          <theme.Input
            label={t("speechSettings.voice")}
            value={value.voice ?? ""}
            onChange={(e: any) => {
              const raw = String(e.target.value ?? "").trim();
              onChange({ ...value, voice: raw ? raw : undefined });
            }}
          />

          <theme.Input
            label={t("outputFormat")}
            value={value.outputFormat}
            onChange={(val) =>
              onChange({
                ...value,
                outputFormat: val.target.value === "auto" ? undefined : val.target.value,
              })
            }
          />

          <theme.Input
            label={t("speechSettings.speed", { speed: value.speed ?? 1 })}
            type="number"
            value={value.speed ?? ""}
            onChange={(v) => onChange({
              ...value, speed: v.target.value && v.target.value.length > 0 ?
                Number(v.target.value) : undefined
            })}
          />

          <theme.Input
            label={t("language")}
            value={value.language ?? ""}
            onChange={(e: any) => {
              const raw = String(e.target.value ?? "").trim();
              onChange({ ...value, language: raw ? raw : undefined });
            }}
          />

          <theme.TextArea
            label={t("instructions")}
            rows={4}
            value={value.instructions ?? ""}
            onChange={(v: string) =>
              onChange({
                ...value,
                instructions: v?.trim() ? v : undefined,
              })
            }
          />
        </div>
      </theme.Card>
    </div>
  );
};

