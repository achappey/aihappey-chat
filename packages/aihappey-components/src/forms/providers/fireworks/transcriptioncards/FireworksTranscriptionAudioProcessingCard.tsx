import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { FireworksTranscriptionConfig } from "../FireworksTranscriptionConfigForm";

export const FireworksTranscriptionAudioProcessingCard: React.FC<{
    config: FireworksTranscriptionConfig;
    updateConfig: (val: FireworksTranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const vadModelOptions = [
        { value: "", label: t("providerDefault") },
        { value: "silero", label: "silero" },
        { value: "whisperx-pyannet", label: "whisperx-pyannet" },
    ];

    const alignmentModelOptions = [
        { value: "", label: t("providerDefault") },
        { value: "mms_fa", label: "mms_fa" },
        { value: "tdnn_ffn", label: "tdnn_ffn" },
    ];

    const preprocessingOptions = [
        { value: "", label: t("providerDefault") },
        { value: "none", label: "none" },
        { value: "dynamic", label: "dynamic" },
        { value: "soft_dynamic", label: "soft_dynamic" },
        { value: "bass_dynamic", label: "bass_dynamic" },
    ];

    return (
        <theme.Card title={t("providers:fireworks.audioProcessing")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <theme.Select
                    label={t("providers:fireworks.vadModel")}
                    values={[config?.vad_model ?? ""]}
                    valueTitle={
                        vadModelOptions.find((o) => o.value === (config?.vad_model ?? ""))
                            ?.label
                    }
                    options={vadModelOptions}
                    onChange={(val: string) =>
                        updateConfig({
                            ...config,
                            vad_model: (val?.trim() ? val : undefined) as
                                | FireworksTranscriptionConfig["vad_model"]
                                | undefined,
                        })
                    }
                    style={{ minWidth: 220 }}
                >
                    {vadModelOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </theme.Select>

                <theme.Select
                    label={t("providers:fireworks.alignmentModel")}
                    values={[config?.alignment_model ?? ""]}
                    valueTitle={
                        alignmentModelOptions.find(
                            (o) => o.value === (config?.alignment_model ?? "")
                        )?.label
                    }
                    options={alignmentModelOptions}
                    onChange={(val: string) =>
                        updateConfig({
                            ...config,
                            alignment_model: (val?.trim() ? val : undefined) as
                                | FireworksTranscriptionConfig["alignment_model"]
                                | undefined,
                        })
                    }
                    style={{ minWidth: 220 }}
                >
                    {alignmentModelOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </theme.Select>

                <theme.Select
                    label={t("providers:fireworks.preprocessing")}
                    values={[config?.preprocessing ?? ""]}
                    valueTitle={
                        preprocessingOptions.find(
                            (o) => o.value === (config?.preprocessing ?? "")
                        )?.label
                    }
                    options={preprocessingOptions}
                    onChange={(val: string) =>
                        updateConfig({
                            ...config,
                            preprocessing: (val?.trim() ? val : undefined) as
                                | FireworksTranscriptionConfig["preprocessing"]
                                | undefined,
                        })
                    }
                    style={{ minWidth: 220 }}
                >
                    {preprocessingOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </theme.Select>
            </div>
        </theme.Card>
    );
};