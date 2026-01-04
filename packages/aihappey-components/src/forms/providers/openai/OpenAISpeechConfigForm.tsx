import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export type OpenAISpeechConfig = {
  voice?: string | any;
  response_format?: string;
  speed?: number;
};

export const OpenAISpeechConfigForm: React.FC<{
  config: OpenAISpeechConfig;
  updateConfig: (val: OpenAISpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const DEFAULT_VALUE = "__default__";
  const CUSTOM_VALUE = "__custom__";

  const BUILTIN_VOICES = [
    "alloy",
    "ash",
    "ballad",
    "coral",
    "echo",
    "fable",
    "onyx",
    "nova",
    "sage",
    "shimmer",
    "verse",
    "marin",
    "cedar",
  ] as const;

  const OUTPUT_FORMATS = ["mp3", "opus", "aac", "flac", "wav", "pcm"] as const;

  const isBuiltinVoice = (v?: string) => !!v && BUILTIN_VOICES.includes(v as any);
  const voiceMode: "default" | "builtin" | "custom" = !config?.voice
    ? "default"
    : isBuiltinVoice(config.voice)
      ? "builtin"
      : "custom";

  const voiceSelectValue =
    voiceMode === "default"
      ? DEFAULT_VALUE
      : voiceMode === "custom"
        ? CUSTOM_VALUE
        : (config.voice as string);

  const capitalize = (s: string) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  const voiceOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...BUILTIN_VOICES.map((v) => ({
      value: v,
      label: capitalize(v),
    })),
    { value: CUSTOM_VALUE, label: t("custom") },
  ];


  const outputFormatOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...OUTPUT_FORMATS.map((v) => ({ value: v, label: v })),
  ];

  /*

  voice
string or object

Required
The voice to use when generating the audio. Supported built-in voices are alloy, ash, ballad, coral, echo, fable, onyx, nova, sage, shimmer, verse, marin, and cedar. You may also provide a custom voice object with an id, for example { "id": "voice_1234" }. Previews of the voices are available in the Text to speech guide.*/
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

              if (raw === CUSTOM_VALUE) {
                // Switch to custom mode; keep the existing custom id if already set.
                updateConfig({
                  ...config,
                  //voice:  {}
                  voice: isBuiltinVoice(config?.voice) ? { id: "" } :
                    config.voice ? {
                      id: config.voice
                    } : { id: "" }
                  //(config?.voice ?? undefined),
                });
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

          <theme.Input
            label={`${t("providers:openai.customVoice")}`}
            value={isBuiltinVoice(config?.voice) ? "" : (config?.voice?.id ?? "")}
            placeholder={'ex. voice_1234'}
            disabled={voiceSelectValue !== CUSTOM_VALUE}
            onChange={(e: any) => {
              const raw = String(e.target.value ?? "").trim();
              updateConfig({ ...config, voice: raw ? { id: raw } : undefined });
            }}
          />

          <theme.Select
            label={t("speechSettings.outputFormat")}
            values={config?.response_format ? [config.response_format] : [DEFAULT_VALUE]}
            valueTitle={
              outputFormatOptions.find(
                (o) =>
                  o.value === (config?.response_format ?? DEFAULT_VALUE)
              )?.label
            }
            options={outputFormatOptions}
            onChange={(val: string) => {
              updateConfig({
                ...config,
                response_format: val === DEFAULT_VALUE ? undefined : val,
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

          <theme.Slider
            label={t("speechSettings.speedWithValue", { speed: config?.speed ?? 1 })}
            min={0.25}
            max={4.0}
            step={0.25}
            value={config?.speed ?? 1}
            onChange={(value: number) =>
              updateConfig({
                ...config,
                speed: value,
              })
            }
          />
        </div>
      </theme.Card>
    </div>
  );
};

