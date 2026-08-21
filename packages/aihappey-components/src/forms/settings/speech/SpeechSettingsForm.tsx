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
  const selectedOutputFormat = value.outputFormat || "auto";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}>
        <div>
          <theme.Input
            label={t("speechSettings.voice")}
            placeholder={t("speechSettings.voicePlaceholder")}
            value={value.voice ?? ""}
            onChange={(e: any) => {
              const raw = String(e.target.value ?? "").trim();
              onChange({ ...value, voice: raw ? raw : undefined });
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
              width: "100%",
            }}
          >
            <theme.Select
              label={t("outputFormat")}
              values={[selectedOutputFormat]}
              valueTitle={
                outputFormatOptions.find(
                  (option) => option.value === selectedOutputFormat
                )?.label ?? t("providerDefault")
              }
              options={outputFormatOptions}
              onChange={(selected: string) =>
                onChange({
                  ...value,
                  outputFormat: selected === "auto" ? undefined : selected,
                })
              }
            >
              {outputFormatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </theme.Select>

            <theme.Slider
              label={t("speechSettings.speedWithValue", { speed: value.speed ?? 1 })}
              min={0.5}
              max={2.0}
              step={0.1}
              value={value.speed ?? 1}
              onChange={(speed: number) => onChange({ ...value, speed })}
            />
          </div>

          <theme.Input
            label={t("language")}
            placeholder={t("speechSettings.languagePlaceholder")}
            value={value.language ?? ""}
            onChange={(e: any) => {
              const raw = String(e.target.value ?? "").trim();
              onChange({ ...value, language: raw ? raw : undefined });
            }}
          />

          <theme.TextArea
            label={t("instructions")}
            placeholder={t("speechSettings.instructionsPlaceholder")}
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

