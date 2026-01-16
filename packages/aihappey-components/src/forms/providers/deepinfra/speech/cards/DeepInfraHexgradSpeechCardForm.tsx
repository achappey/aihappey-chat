import React from "react";
import { useTheme } from "../../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type {
  DeepInfraHexgradSpeechConfig,
  DeepInfraSpeechConfig,
} from "../DeepInfraSpeechConfigForm";

const DEFAULT_VALUE = "__default__";

const RESPONSE_FORMATS = ["mp3", "opus", "flac", "wav", "pcm"] as const;

const isKnownResponseFormat = (v?: string) =>
  !!v && (RESPONSE_FORMATS as readonly string[]).includes(v);

const toPresetVoiceList = (raw: string) => {
  const list = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return list.length ? list : undefined;
};

export const DeepInfraHexgradSpeechCardForm: React.FC<{
  config: DeepInfraSpeechConfig;
  updateConfig: (val: DeepInfraSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const hexgradConfig = config?.hexgrad ?? {};

  const updateHexgradConfig = (patch: Partial<DeepInfraHexgradSpeechConfig>) => {
    updateConfig({
      ...config,
      hexgrad: {
        ...hexgradConfig,
        ...patch,
      },
    });
  };

  const responseFormatSelectValue = isKnownResponseFormat(hexgradConfig?.output_format)
    ? (hexgradConfig.output_format as string)
    : DEFAULT_VALUE;

  const responseFormatOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...RESPONSE_FORMATS.map((f) => ({ value: f, label: f })),
  ];

  const presetVoiceValue = Array.isArray(hexgradConfig?.preset_voice)
    ? hexgradConfig.preset_voice.join(", ")
    : "";

  return (
    <theme.Card size="small" title="Hexgrad">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Select
          label={t("outputFormat")}
          values={[responseFormatSelectValue]}
          valueTitle={
            responseFormatOptions.find((o) => o.value === responseFormatSelectValue)?.label
          }
          options={responseFormatOptions}
          onChange={(val: string) => {
            const raw = String(val ?? "");
            updateHexgradConfig({
              output_format: raw === DEFAULT_VALUE ? undefined : raw,
            });
          }}
          style={{ minWidth: 220 }}
        >
          {responseFormatOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>

        <theme.Input
          id="deepinfra-speech-hexgrad-preset-voice"
          label={t("speechSettings.voice")}
          placeholder={t("providers:deepinfra.speech.presetVoicePlaceholder")}
          value={presetVoiceValue}
          onChange={(e: any) => {
            const raw = String(e?.target?.value ?? "");
            updateHexgradConfig({
              preset_voice: toPresetVoiceList(raw),
            });
          }}
        />

        <theme.Input
          id="deepinfra-speech-hexgrad-speed"
          type="number"
          step={0.01}
          min={0.25}
          max={4}
          label={t("providers:deepinfra.speech.speed")}
          value={hexgradConfig?.speed ?? ""}
          onChange={(e: any) => {
            const raw = String(e?.target?.value ?? "").trim();
            updateHexgradConfig({
              speed: raw.length ? Number(raw) : undefined,
            });
          }}
        />

        <theme.Switch
          id="deepinfra-speech-hexgrad-return-timestamps"
          label={t("providers:deepinfra.speech.returnTimestamps")}
          checked={hexgradConfig?.return_timestamps ?? false}
          onChange={(enabled) => updateHexgradConfig({ return_timestamps: enabled })}
        />

        <theme.Input
          id="deepinfra-speech-hexgrad-sample-rate"
          type="number"
          step={1}
          min={0}
          label={t("speechSettings.sampleRate")}
          value={hexgradConfig?.sample_rate ?? ""}
          onChange={(e: any) => {
            const raw = String(e?.target?.value ?? "").trim();
            updateHexgradConfig({
              sample_rate: raw.length ? Number(raw) : undefined,
            });
          }}
        />

        <div style={{ display: "flex", gap: 12, width: "100%" }}>
          <theme.Input
            id="deepinfra-speech-hexgrad-target-min-tokens"
            type="number"
            step={1}
            min={0}
            style={{ flex: 1 }}
            label={t("providers:deepinfra.speech.targetMinTokens")}
            value={hexgradConfig?.target_min_tokens ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateHexgradConfig({
                target_min_tokens: raw.length ? Number(raw) : undefined,
              });
            }}
          />

          <theme.Input
            id="deepinfra-speech-hexgrad-target-max-tokens"
            type="number"
            step={1}
            min={0}
            style={{ flex: 1 }}
            label={t("providers:deepinfra.speech.targetMaxTokens")}
            value={hexgradConfig?.target_max_tokens ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateHexgradConfig({
                target_max_tokens: raw.length ? Number(raw) : undefined,
              });
            }}
          />
        </div>

        <theme.Input
          id="deepinfra-speech-hexgrad-absolute-max-tokens"
          type="number"
          step={1}
          min={0}
          label={t("providers:deepinfra.speech.absoluteMaxTokens")}
          value={hexgradConfig?.absolute_max_tokens ?? ""}
          onChange={(e: any) => {
            const raw = String(e?.target?.value ?? "").trim();
            updateHexgradConfig({
              absolute_max_tokens: raw.length ? Number(raw) : undefined,
            });
          }}
        />
      </div>
    </theme.Card>
  );
};
