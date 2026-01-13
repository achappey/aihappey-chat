import React, { useMemo } from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { MiniMaxSpeechConfig } from "../MiniMaxSpeechConfigForm";
import {
  AUDIO_FORMATS,
  BITRATES,
  CHANNELS,
  DEFAULT_VALUE,
  SAMPLE_RATES,
  hasAnyOwnValue,
} from "./shared";

export const MiniMaxSpeechAudioSettingCard: React.FC<{
  config: MiniMaxSpeechConfig;
  updateConfig: (val: MiniMaxSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const updateAudioSetting = (next: Partial<MiniMaxSpeechConfig["audio_setting"]>) => {
    const merged = {
      ...(config?.audio_setting ?? {}),
      ...next,
    } as NonNullable<MiniMaxSpeechConfig["audio_setting"]>;

    updateConfig({
      ...config,
      audio_setting: hasAnyOwnValue(merged) ? merged : undefined,
    });
  };

  const audioFormatOptions = useMemo(
    () => [
      { value: DEFAULT_VALUE, label: t("providerDefault") },
      ...AUDIO_FORMATS.map((v) => ({ value: v, label: v })),
    ],
    [t]
  );

  const sampleRateOptions = useMemo(
    () => [
      { value: DEFAULT_VALUE, label: t("providerDefault") },
      ...SAMPLE_RATES.map((v) => ({ value: String(v), label: String(v) })),
    ],
    [t]
  );

  const bitrateOptions = useMemo(
    () => [
      { value: DEFAULT_VALUE, label: t("providerDefault") },
      ...BITRATES.map((v) => ({ value: String(v), label: String(v) })),
    ],
    [t]
  );

  const channelOptions = useMemo(
    () => [
      { value: DEFAULT_VALUE, label: t("providerDefault") },
      ...CHANNELS.map((v) => ({ value: String(v), label: String(v) })),
    ],
    [t]
  );

  return (
    <theme.Card size="small" title={t("providers:minimax.audioSetting")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Select
          label={t("providers:minimax.audioFormat")}
          values={[config?.audio_setting?.format ?? DEFAULT_VALUE]}
          valueTitle={
            audioFormatOptions.find(
              (o) => o.value === (config?.audio_setting?.format ?? DEFAULT_VALUE)
            )?.label
          }
          options={audioFormatOptions}
          onChange={(val: string) => {
            const raw = String(val ?? "");
            updateAudioSetting({ format: raw === DEFAULT_VALUE ? undefined : raw });
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
          label={t("providers:minimax.sampleRate")}
          values={[
            typeof config?.audio_setting?.sample_rate === "number"
              ? String(config.audio_setting.sample_rate)
              : DEFAULT_VALUE,
          ]}
          valueTitle={
            sampleRateOptions.find(
              (o) =>
                o.value ===
                (typeof config?.audio_setting?.sample_rate === "number"
                  ? String(config.audio_setting.sample_rate)
                  : DEFAULT_VALUE)
            )?.label
          }
          options={sampleRateOptions}
          onChange={(val: string) => {
            const raw = String(val ?? "");
            if (raw === DEFAULT_VALUE) {
              updateAudioSetting({ sample_rate: undefined });
              return;
            }
            const next = Number(raw);
            updateAudioSetting({ sample_rate: Number.isNaN(next) ? undefined : next });
          }}
          style={{ minWidth: 220 }}
        >
          {sampleRateOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>

        <theme.Select
          label={t("providers:minimax.bitrate")}
          values={[
            typeof config?.audio_setting?.bitrate === "number"
              ? String(config.audio_setting.bitrate)
              : DEFAULT_VALUE,
          ]}
          valueTitle={
            bitrateOptions.find(
              (o) =>
                o.value ===
                (typeof config?.audio_setting?.bitrate === "number"
                  ? String(config.audio_setting.bitrate)
                  : DEFAULT_VALUE)
            )?.label
          }
          options={bitrateOptions}
          onChange={(val: string) => {
            const raw = String(val ?? "");
            if (raw === DEFAULT_VALUE) {
              updateAudioSetting({ bitrate: undefined });
              return;
            }
            const next = Number(raw);
            updateAudioSetting({ bitrate: Number.isNaN(next) ? undefined : next });
          }}
          style={{ minWidth: 220 }}
        >
          {bitrateOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>

        <theme.Select
          label={t("providers:minimax.channel")}
          values={[
            typeof config?.audio_setting?.channel === "number"
              ? String(config.audio_setting.channel)
              : DEFAULT_VALUE,
          ]}
          valueTitle={
            channelOptions.find(
              (o) =>
                o.value ===
                (typeof config?.audio_setting?.channel === "number"
                  ? String(config.audio_setting.channel)
                  : DEFAULT_VALUE)
            )?.label
          }
          options={channelOptions}
          onChange={(val: string) => {
            const raw = String(val ?? "");
            if (raw === DEFAULT_VALUE) {
              updateAudioSetting({ channel: undefined });
              return;
            }
            const next = Number(raw);
            updateAudioSetting({ channel: Number.isNaN(next) ? undefined : next });
          }}
          style={{ minWidth: 220 }}
        >
          {channelOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>

        <theme.Switch
          id="minimax-speech-force-cbr"
          label={t("providers:minimax.forceCbr")}
          checked={config?.audio_setting?.force_cbr ?? false}
          onChange={(enabled) =>
            updateAudioSetting({ force_cbr: enabled ? true : undefined })
          }
        />
      </div>
    </theme.Card>
  );
};

