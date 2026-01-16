import React from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../../theme/ThemeContext";
import { FireworksTranscriptionConfig } from "../FireworksTranscriptionConfigForm";

export const FireworksTranscriptionDiarizationCard: React.FC<{
    config: FireworksTranscriptionConfig;
    updateConfig: (val: FireworksTranscriptionConfig) => void;
    diarizeEnabled: boolean;
    setDiarize: (enabled: boolean) => void;
}> = ({ config, updateConfig, diarizeEnabled, setDiarize }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <theme.Card
            title={t("providers:fireworks.diarization")}
            headerActions={
                <theme.Switch
                    id="fireworks-transcription-diarize"
                    checked={diarizeEnabled}
                    onChange={setDiarize}
                />
            }
        >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <theme.Input
                    id="fireworks-transcription-min-speakers"
                    type="number"
                    min={1}
                    disabled={!diarizeEnabled}
                    step={1}
                    label={t("providers:fireworks.minSpeakers")}
                    value={config?.min_speakers ?? ""}
                    onChange={(e: any) =>
                        updateConfig({
                            ...config,
                            min_speakers: e.target.value ? Number(e.target.value) : undefined,
                        })
                    }
                />

                <theme.Input
                    id="fireworks-transcription-max-speakers"
                    type="number"
                    disabled={!diarizeEnabled}
                    min={1}
                    step={1}
                    label={t("providers:fireworks.maxSpeakers")}
                    value={config?.max_speakers ?? ""}
                    onChange={(e: any) =>
                        updateConfig({
                            ...config,
                            max_speakers: e.target.value ? Number(e.target.value) : undefined,
                        })
                    }
                />
            </div>
        </theme.Card>
    );
};