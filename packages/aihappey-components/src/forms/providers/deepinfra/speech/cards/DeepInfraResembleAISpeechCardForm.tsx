import React from "react";
import { useTheme } from "../../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type {
  DeepInfraResembleAISpeechConfig,
  DeepInfraSpeechConfig,
} from "../DeepInfraSpeechConfigForm";

const DEFAULT_VALUE = "__default__";
const CUSTOM_VALUE = "__custom__";

const BUILTIN_VOICES = [
  "luna",
  "aura",
  "quartz",
  "af_alloy",
  "af_aoede",
  "af_bella",
  "af_heart",
  "af_jessica",
  "af_kore",
  "af_nicole",
  "af_nova",
  "af_river",
  "af_sarah",
  "af_sky",
  "am_adam",
  "am_echo",
  "am_eric",
  "am_fenrir",
  "am_liam",
  "am_michael",
  "am_onyx",
  "am_puck",
  "am_santa",
  "bf_alice",
  "bf_emma",
  "bf_isabella",
  "bf_lily",
  "bm_daniel",
  "bm_fable",
  "bm_george",
  "bm_lewis",
  "ef_dora",
  "em_alex",
  "em_santa",
  "ff_siwis",
  "hf_alpha",
  "hf_beta",
  "hm_omega",
  "hm_psi",
  "if_sara",
  "im_nicola",
  "jf_alpha",
  "jf_gongitsune",
  "jf_nezumi",
  "jf_tebukuro",
  "jm_kumo",
  "pf_dora",
  "pm_alex",
  "pm_santa",
  "zf_xiaobei",
  "zf_xiaoni",
  "zf_xiaoxiao",
  "zf_xiaoyi",
  "zm_yunjian",
  "zm_yunxi",
  "zm_yunxia",
  "zm_yunyang",
] as const;

const RESPONSE_FORMATS = ["mp3", "opus", "flac", "wav", "pcm"] as const;

const isKnownResponseFormat = (v?: string) =>
  !!v && (RESPONSE_FORMATS as readonly string[]).includes(v);

const isBuiltinVoice = (v?: string) => !!v && BUILTIN_VOICES.includes(v as any);

export const DeepInfraResembleAISpeechCardForm: React.FC<{
  config: DeepInfraSpeechConfig;
  updateConfig: (val: DeepInfraSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const resembleConfig = config?.resembleai ?? {};

  const updateResembleConfig = (patch: Partial<DeepInfraResembleAISpeechConfig>) => {
    updateConfig({
      ...config,
      resembleai: {
        ...resembleConfig,
        ...patch,
      },
    });
  };

  const responseFormatSelectValue = isKnownResponseFormat(resembleConfig?.response_format)
    ? (resembleConfig.response_format as string)
    : DEFAULT_VALUE;

  const responseFormatOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...RESPONSE_FORMATS.map((f) => ({ value: f, label: f })),
  ];

  const voiceMode: "default" | "builtin" | "custom" = !resembleConfig?.voice_id
    ? "default"
    : isBuiltinVoice(resembleConfig.voice_id)
      ? "builtin"
      : "custom";

  const voiceSelectValue =
    voiceMode === "default"
      ? DEFAULT_VALUE
      : voiceMode === "custom"
        ? CUSTOM_VALUE
        : (resembleConfig.voice_id as string);

  const voiceOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...BUILTIN_VOICES.map((voice) => ({ value: voice, label: voice })),
    { value: CUSTOM_VALUE, label: t("custom") },
  ];

  return (
    <theme.Card
      size="small"
      title={"ResembleAI"}
    >
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
            updateResembleConfig({
              response_format: raw === DEFAULT_VALUE ? undefined : raw,
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

        <theme.Select
          label={t("providers:deepinfra.speech.voiceId")}
          values={[voiceSelectValue]}
          valueTitle={voiceOptions.find((o) => o.value === voiceSelectValue)?.label}
          options={voiceOptions}
          onChange={(val: string) => {
            const raw = String(val ?? "");

            if (raw === DEFAULT_VALUE) {
              updateResembleConfig({ voice_id: undefined });
              return;
            }

            if (raw === CUSTOM_VALUE) {
              updateResembleConfig({
                voice_id: isBuiltinVoice(resembleConfig?.voice_id)
                  ? ""
                  : resembleConfig?.voice_id,
              });
              return;
            }

            updateResembleConfig({ voice_id: raw });
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
          id="deepinfra-speech-voice-id"
          label={t("providers:deepinfra.speech.voiceId")}
          placeholder={t("providers:deepinfra.speech.voiceIdPlaceholder")}
          value={isBuiltinVoice(resembleConfig?.voice_id) ? "" : (resembleConfig?.voice_id ?? "")}
          disabled={voiceSelectValue !== CUSTOM_VALUE}
          onChange={(e: any) => {
            const raw = String(e?.target?.value ?? "").trim();
            updateResembleConfig({
              voice_id: raw.length ? raw : undefined,
            });
          }}
        />

        <theme.Input
          id="deepinfra-speech-language-id"
          label={t("providers:deepinfra.speech.languageId")}
          placeholder={t("providers:deepinfra.speech.languageIdPlaceholder")}
          value={resembleConfig?.language_id ?? ""}
          onChange={(e: any) => {
            const raw = String(e?.target?.value ?? "").trim();
            updateResembleConfig({
              language_id: raw.length ? raw : undefined,
            });
          }}
        />

        <div style={{ display: "flex", gap: 12, width: "100%" }}>
          <theme.Input
            id="deepinfra-speech-temperature"
            type="number"
            step={0.01}
            style={{ flex: 1 }}
            min={0}
            max={2}
            label={t("temperature",
              { temperature: resembleConfig?.temperature ?? t('providerDefault').toLocaleLowerCase() })}
            value={resembleConfig?.temperature ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateResembleConfig({
                temperature: raw.length ? Number(raw) : undefined,
              });
            }}
          />

          <theme.Input
            id="deepinfra-speech-seed"
            type="number"
            step={1}
            min={0}
            style={{ flex: 1 }}
            max={2147483647}
            label={t("providers:deepinfra.speech.seed")}
            value={resembleConfig?.seed ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateResembleConfig({
                seed: raw.length ? Number(raw) : undefined,
              });
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 12, width: "100%" }}>
          <theme.Input
            id="deepinfra-speech-top-p"
            type="number"
            step={0.01}
            min={0}
            style={{ flex: 1 }}
            max={1}
            label={t("providers:deepinfra.speech.topP")}
            value={resembleConfig?.top_p ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateResembleConfig({
                top_p: raw.length ? Number(raw) : undefined,
              });
            }}
          />

          <theme.Input
            id="deepinfra-speech-min-p"
            type="number"
            step={0.01}
            style={{ flex: 1 }}
            min={0}
            max={1}
            label={t("providers:deepinfra.speech.minP")}
            value={resembleConfig?.min_p ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateResembleConfig({
                min_p: raw.length ? Number(raw) : undefined,
              });
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 12, width: "100%" }}>
          <theme.Input
            id="deepinfra-speech-repetition-penalty"
            type="number"
            step={0.1}
            style={{ flex: 1 }}
            min={0}
            max={5}
            label={t("providers:deepinfra.speech.repetitionPenalty")}
            value={resembleConfig?.repetition_penalty ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateResembleConfig({
                repetition_penalty: raw.length ? Number(raw) : undefined,
              });
            }}
          />

          <theme.Input
            id="deepinfra-speech-top-k"
            type="number"
            step={1}
            style={{ flex: 1 }}
            min={0}
            max={1000}
            label={t("providers:deepinfra.speech.topK")}
            value={resembleConfig?.top_k ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateResembleConfig({
                top_k: raw.length ? Number(raw) : undefined,
              });
            }}
          />
        </div>

      </div>
    </theme.Card>
  );
};
