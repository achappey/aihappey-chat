import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { AssemblyAITranscriptionConfig } from "../types";
import { parseOptionalInt } from "../fields/shared";

export const AssemblyAIChannelsAndDiarizationCardForm: React.FC<{
  config: AssemblyAITranscriptionConfig;
  updateConfig: (val: AssemblyAITranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const diarizationOn = config?.speaker_labels ?? false;

  const setDiarization = (enabled: boolean) => {
    if (enabled) {
      updateConfig({
        ...config,
        speaker_labels: true,
      });
      return;
    }
    updateConfig({
      ...config,
      speaker_labels: false,
      speakers_expected: undefined,
    });
  };

  return (
    <theme.Card
      size="small"
      title={t("providers:assemblyai.channelsAndDiarization")}
      description={t("providers:assemblyai.channelsAndDiarizationHint")}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Switch
          id="assemblyai-multichannel"
          label={t("providers:assemblyai.multichannel")}
          checked={config?.multichannel ?? false}
          onChange={(enabled) => updateConfig({ ...config, multichannel: !!enabled })}
        />

        <theme.Switch
          id="assemblyai-speaker-labels"
          label={t("providers:assemblyai.speakerLabels")}
          checked={diarizationOn}
          onChange={setDiarization}
        />

        <theme.Input
          id="assemblyai-speakers-expected"
          type="number"
          min={1}
          step={1}
          disabled={!diarizationOn}
          label={t("providers:assemblyai.speakersExpected")}
          value={config?.speakers_expected ?? ""}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              speakers_expected: parseOptionalInt(e?.target?.value),
            })
          }
        />
      </div>
    </theme.Card>
  );
};

