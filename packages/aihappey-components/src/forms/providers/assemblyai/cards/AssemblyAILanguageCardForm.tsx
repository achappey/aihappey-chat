import React, { useMemo } from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { AssemblyAITranscriptionConfig } from "../types";
import { ASSEMBLYAI_LANGUAGE_CODES } from "../constants";
import { parseOptionalNumber } from "../fields/shared";

type Option = { value: string; label: string };

export const AssemblyAILanguageCardForm: React.FC<{
  config: AssemblyAITranscriptionConfig;
  updateConfig: (val: AssemblyAITranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const languageOptions: Option[] = useMemo(
    () => [{ value: "", label: t("providerDefault") }, ...ASSEMBLYAI_LANGUAGE_CODES.map((c) => ({ value: c, label: c }))],
    [t]
  );

  const languageValue = (config?.language_code ?? "").trim();
  const languageTitle =
    languageOptions.find((o) => o.value === languageValue)?.label ??
    (languageValue ? languageValue : t("providerDefault"));

  return (
    <theme.Card size="small" title={t("providers:assemblyai.language")} description={t("providers:assemblyai.languageHint")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Select
          label={t("providers:assemblyai.languageCode")}
          values={[languageValue]}
          valueTitle={languageTitle}
          options={languageOptions}
          onChange={(val: string) => {
            const raw = String(val ?? "").trim();
            updateConfig({
              ...config,
              language_code: raw.length ? raw : undefined,
            });
          }}
          style={{ minWidth: 220 }}
        >
          {languageOptions.map((o) => (
            <option key={o.value || "__default"} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>

        <theme.Switch
          id="assemblyai-language-detection"
          label={t("providers:assemblyai.languageDetection")}
          checked={config?.language_detection ?? false}
          onChange={(enabled) => updateConfig({ ...config, language_detection: !!enabled })}
        />

        <theme.Input
          id="assemblyai-language-confidence-threshold"
          type="number"
          min={0}
          max={1}
          step={0.05}
          label={t("providers:assemblyai.languageConfidenceThreshold")}
          value={config?.language_confidence_threshold ?? ""}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              language_confidence_threshold: parseOptionalNumber(e?.target?.value),
            })
          }
        />
      </div>
    </theme.Card>
  );
};

