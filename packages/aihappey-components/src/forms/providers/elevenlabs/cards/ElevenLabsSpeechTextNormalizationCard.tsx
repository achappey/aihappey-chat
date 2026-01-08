import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { ElevenLabsSpeechConfig } from "../ElevenLabsSpeechConfigForm";

export const ElevenLabsSpeechTextNormalizationCard: React.FC<{
  config: ElevenLabsSpeechConfig;
  updateConfig: (val: ElevenLabsSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const DEFAULT_VALUE = "__default__";

  const applyTextNormalizationOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    { value: "auto", label: "auto" },
    { value: "on", label: "on" },
    { value: "off", label: "off" },
  ];

  return (
    <theme.Card size="small" title={t("providers:elevenlabs.textNormalization")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Select
          label={t("providers:elevenlabs.applyTextNormalization")}
          values={[config?.apply_text_normalization ?? DEFAULT_VALUE]}
          valueTitle={
            applyTextNormalizationOptions.find(
              (o) => o.value === (config?.apply_text_normalization ?? DEFAULT_VALUE)
            )?.label
          }
          options={applyTextNormalizationOptions}
          onChange={(val: string) => {
            const raw = String(val ?? "");
            updateConfig({
              ...config,
              apply_text_normalization:
                raw === DEFAULT_VALUE ? undefined : (raw as any),
            });
          }}
          style={{ minWidth: 220 }}
        >
          {applyTextNormalizationOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>

        <theme.Switch
          id="elevenlabs-speech-apply-language-text-normalization"
          label={t("providers:elevenlabs.applyLanguageTextNormalization")}
          checked={config?.apply_language_text_normalization ?? false}
          onChange={(enabled) =>
            updateConfig({
              ...config,
              apply_language_text_normalization: enabled,
            })
          }
        />
      </div>
    </theme.Card>
  );
};

