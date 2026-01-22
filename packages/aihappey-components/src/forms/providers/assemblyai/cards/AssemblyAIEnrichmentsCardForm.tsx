import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { AssemblyAITranscriptionConfig } from "../types";

export const AssemblyAIEnrichmentsCardForm: React.FC<{
  config: AssemblyAITranscriptionConfig;
  updateConfig: (val: AssemblyAITranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <theme.Card size="small" title={t("providers:assemblyai.enrichments")} description={t("providers:assemblyai.enrichmentsHint")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Switch
          id="assemblyai-auto-chapters"
          label={t("providers:assemblyai.autoChapters")}
          checked={config?.auto_chapters ?? false}
          onChange={(enabled) => updateConfig({ ...config, auto_chapters: !!enabled })}
        />
        <theme.Switch
          id="assemblyai-auto-highlights"
          label={t("providers:assemblyai.autoHighlights")}
          checked={config?.auto_highlights ?? false}
          onChange={(enabled) => updateConfig({ ...config, auto_highlights: !!enabled })}
        />
        <theme.Switch
          id="assemblyai-entity-detection"
          label={t("providers:assemblyai.entityDetection")}
          checked={config?.entity_detection ?? false}
          onChange={(enabled) => updateConfig({ ...config, entity_detection: !!enabled })}
        />
        <theme.Switch
          id="assemblyai-sentiment-analysis"
          label={t("providers:assemblyai.sentimentAnalysis")}
          checked={config?.sentiment_analysis ?? false}
          onChange={(enabled) => updateConfig({ ...config, sentiment_analysis: !!enabled })}
        />
        <theme.Switch
          id="assemblyai-iab-categories"
          label={t("providers:assemblyai.iabCategories")}
          checked={config?.iab_categories ?? false}
          onChange={(enabled) => updateConfig({ ...config, iab_categories: !!enabled })}
        />
      </div>
    </theme.Card>
  );
};

