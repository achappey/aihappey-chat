import React, { useMemo } from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { MiniMaxSpeechConfig } from "../MiniMaxSpeechConfigForm";
import { DEFAULT_VALUE, LANGUAGE_BOOST_OPTIONS } from "./shared";

export const MiniMaxSpeechGeneralCard: React.FC<{
  config: MiniMaxSpeechConfig;
  updateConfig: (val: MiniMaxSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const languageBoostOptions = useMemo(
    () => [
      { value: DEFAULT_VALUE, label: t("providerDefault") },
      ...LANGUAGE_BOOST_OPTIONS.map((v) => ({ value: v, label: v })),
    ],
    [t]
  );

  return (
    <theme.Card size="small" title={t("general")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Select
          label={t("providers:minimax.languageBoost")}
          values={[config?.language_boost ?? DEFAULT_VALUE]}
          valueTitle={
            languageBoostOptions.find(
              (o) => o.value === (config?.language_boost ?? DEFAULT_VALUE)
            )?.label
          }
          options={languageBoostOptions}
          onChange={(val: string) => {
            const raw = String(val ?? "");
            updateConfig({
              ...config,
              language_boost: raw === DEFAULT_VALUE ? undefined : raw,
            });
          }}
          style={{ minWidth: 220 }}
        >
          {languageBoostOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>

        <theme.Switch
          id="minimax-speech-subtitle-enable"
          label={t("providers:minimax.subtitleEnable")}
          checked={config?.subtitle_enable ?? false}
          onChange={(enabled) =>
            updateConfig({ ...config, subtitle_enable: enabled ? true : undefined })
          }
        />
      </div>
    </theme.Card>
  );
};

