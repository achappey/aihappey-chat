import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { ElevenLabsSpeechConfig } from "../ElevenLabsSpeechConfigForm";

type TriBool = "__default__" | "true" | "false";

const triBoolToValue = (v: TriBool): boolean | undefined => {
  if (v === "__default__") return undefined;
  return v === "true";
};

const valueToTriBool = (v: boolean | undefined): TriBool => {
  if (v === undefined) return "__default__";
  return v ? "true" : "false";
};

export const ElevenLabsSpeechMusicCard: React.FC<{
  config: ElevenLabsSpeechConfig;
  updateConfig: (val: ElevenLabsSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const triBoolOptions = [
    { value: "__default__", label: t("providerDefault") },
    { value: "true", label: "on" },
    { value: "false", label: "off" },
  ];

  return (
    <theme.Card size="small" title={t("providers:elevenlabs.music")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Input
          id="elevenlabs-speech-music-length-ms"
          type="number"
          min={3000}
          max={600000}
          step={1}
          label={t("providers:elevenlabs.musicLengthMs")}
          value={config?.music_length_ms ?? ""}
          onChange={(e: any) => {
            const raw = String(e?.target?.value ?? "").trim();
            updateConfig({
              ...config,
              music_length_ms: raw.length ? Number(raw) : undefined,
            });
          }}
        />

        <theme.Select
          label={t("providers:elevenlabs.forceInstrumental")}
          values={[valueToTriBool(config?.force_instrumental)]}
          valueTitle={
            triBoolOptions.find(
              (o) => o.value === valueToTriBool(config?.force_instrumental)
            )?.label
          }
          options={triBoolOptions}
          onChange={(val: string) =>
            updateConfig({
              ...config,
              force_instrumental: triBoolToValue(val as TriBool),
            })
          }
          style={{ minWidth: 220 }}
        >
          {triBoolOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>

        <theme.Select
          label={t("providers:elevenlabs.respectSectionsDurations")}
          values={[valueToTriBool(config?.respect_sections_durations)]}
          valueTitle={
            triBoolOptions.find(
              (o) => o.value === valueToTriBool(config?.respect_sections_durations)
            )?.label
          }
          options={triBoolOptions}
          onChange={(val: string) =>
            updateConfig({
              ...config,
              respect_sections_durations: triBoolToValue(val as TriBool),
            })
          }
          style={{ minWidth: 220 }}
        >
          {triBoolOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>

        <theme.Select
          label={t("providers:elevenlabs.storeForInpainting")}
          values={[valueToTriBool(config?.store_for_inpainting)]}
          valueTitle={
            triBoolOptions.find(
              (o) => o.value === valueToTriBool(config?.store_for_inpainting)
            )?.label
          }
          options={triBoolOptions}
          onChange={(val: string) =>
            updateConfig({
              ...config,
              store_for_inpainting: triBoolToValue(val as TriBool),
            })
          }
          style={{ minWidth: 220 }}
        >
          {triBoolOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>

        <theme.Select
          label={t("providers:elevenlabs.signWithC2pa")}
          values={[valueToTriBool(config?.sign_with_c2pa)]}
          valueTitle={
            triBoolOptions.find(
              (o) => o.value === valueToTriBool(config?.sign_with_c2pa)
            )?.label
          }
          options={triBoolOptions}
          onChange={(val: string) =>
            updateConfig({
              ...config,
              sign_with_c2pa: triBoolToValue(val as TriBool),
            })
          }
          style={{ minWidth: 220 }}
        >
          {triBoolOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>
      </div>
    </theme.Card>
  );
};

