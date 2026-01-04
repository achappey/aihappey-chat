import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export type GroqSpeechConfig = {
  voice?: string;
  response_format?: string;
};

const GROQ_VOICES = [
  "autumn",
  "diana",
  "hannah",
  "austin",
  "daniel",
  "troy",
  "fahad",
  "sultan",
  "lulwa",
  "noura",
] as const;

export const GroqSpeechConfigForm: React.FC<{
  config: GroqSpeechConfig;
  updateConfig: (val: GroqSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const DEFAULT_VALUE = "__default__";

  const isBuiltinVoice = (v?: string) => !!v && GROQ_VOICES.includes(v as any);

  // If an unknown value is present, show Provider default but don't clear it
  // until the user explicitly changes the dropdown.
  const voiceSelectValue = isBuiltinVoice(config?.voice)
    ? (config.voice as string)
    : DEFAULT_VALUE;

  const capitalize = (s: string) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  const voiceOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...GROQ_VOICES.map((v) => ({ value: v, label: capitalize(v) })),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}>
        <div>
          <theme.Select
            label={t("speechSettings.voice")}
            values={[voiceSelectValue]}
            valueTitle={
              voiceOptions.find((o) => o.value === voiceSelectValue)?.label
            }
            options={voiceOptions}
            onChange={(val: string) => {
              const raw = String(val ?? "");

              if (raw === DEFAULT_VALUE) {
                updateConfig({ ...config, voice: undefined });
                return;
              }

              updateConfig({ ...config, voice: raw });
            }}
            style={{ minWidth: 220 }}
          >
            {voiceOptions.map((o) => (
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

