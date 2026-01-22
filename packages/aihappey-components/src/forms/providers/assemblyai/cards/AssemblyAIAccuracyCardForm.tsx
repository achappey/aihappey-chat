import React, { useMemo } from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { AssemblyAITranscriptionConfig } from "../types";
import { parseOptionalNumber, normalizeList } from "../fields/shared";
import { StringListEditor } from "../fields/StringListEditor";
import { CustomSpellingEditor, type AssemblyAICustomSpellingEntry } from "../fields/CustomSpellingEditor";

export const AssemblyAIAccuracyCardForm: React.FC<{
  config: AssemblyAITranscriptionConfig;
  updateConfig: (val: AssemblyAITranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const keyterms = useMemo(() => normalizeList(config?.keyterms_prompt), [config?.keyterms_prompt]);
  const spellingEntries = useMemo(() => {
    const raw = Array.isArray(config?.custom_spelling) ? config.custom_spelling : [];
    return raw
      .map((e: any) => ({
        to: String(e?.to ?? ""),
        from: Array.isArray(e?.from) ? e.from : (typeof e?.from === "string" ? [e.from] : []),
      }))
      .filter((e) => String(e.to ?? "").trim().length > 0 || (Array.isArray(e.from) && e.from.length > 0));
  }, [config?.custom_spelling]);

  const setSpelling = (next: AssemblyAICustomSpellingEntry[]) => {
    const cleaned = next
      .map((e) => ({
        to: String(e.to ?? "").trim(),
        from: normalizeList(e.from),
      }))
      .filter((e) => e.to.length && e.from.length);

    updateConfig({
      ...config,
      custom_spelling: cleaned.length ? cleaned : undefined,
    });
  };

  return (
    <theme.Card size="small" title={t("providers:assemblyai.accuracy")} description={t("providers:assemblyai.accuracyHint")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Input
          id="assemblyai-speech-threshold"
          type="number"
          min={0}
          max={1}
          step={0.05}
          label={t("providers:assemblyai.speechThreshold")}
          value={config?.speech_threshold ?? ""}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              speech_threshold: parseOptionalNumber(e?.target?.value),
            })
          }
        />

        <StringListEditor
          idPrefix="assemblyai-keyterms"
          label={t("providers:assemblyai.keytermsPrompt")}
          placeholder={t("providers:assemblyai.keytermsPromptPlaceholder")}
          items={keyterms}
          onChange={(next) =>
            updateConfig({
              ...config,
              keyterms_prompt: next.length ? next : undefined,
            })
          }
          maxItems={200}
        />

        <theme.Card size="small" title={t("providers:assemblyai.customSpelling")}>
          <CustomSpellingEditor
            idPrefix="assemblyai-custom-spelling"
            entries={spellingEntries}
            onChange={setSpelling}
          />
        </theme.Card>
      </div>
    </theme.Card>
  );
};

