import React from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";

export type GoogleRealtimeTranscriptionMode = "VERBATIM" | "SMART";

/**
 * Google Live Transcription options used both to constrain the ephemeral token
 * and to configure the matching browser WebSocket session. This type is kept
 * separate from the future non-realtime Google transcription configuration.
 */
export type GoogleRealtimeTranscriptionConfig = {
  uses?: number;
  expireTime?: string;
  liveConnectConstraints?: {
    model?: string;
    config?: {
      responseModalities?: string[];
      inputAudioTranscription?: {
        languageCodes?: string[];
        customVocabulary?: string[];
        mode?: GoogleRealtimeTranscriptionMode;
      };
    };
  };
};

const parseList = (value: string): string[] | undefined => {
  const items = value
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? Array.from(new Set(items)) : undefined;
};

export const GoogleRealtimeTranscriptionConfigForm: React.FC<{
  config: GoogleRealtimeTranscriptionConfig;
  updateConfig: (value: GoogleRealtimeTranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const constraints = config.liveConnectConstraints ?? {};
  const liveConfig = constraints.config ?? {};
  const transcription = liveConfig.inputAudioTranscription ?? {};
  const mode = transcription.mode ?? "VERBATIM";

  const updateTranscription = (
    patch: Partial<NonNullable<typeof liveConfig.inputAudioTranscription>>,
  ) => {
    updateConfig({
      ...config,
      liveConnectConstraints: {
        ...constraints,
        config: {
          ...liveConfig,
          // Google Live Transcription only supports text responses.
          responseModalities: ["TEXT"],
          inputAudioTranscription: {
            ...transcription,
            ...patch,
          },
        },
      },
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("providers:google.realtimeTranscription.title")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            {t("providers:google.realtimeTranscription.hint")}
          </div>

          <theme.TextArea
            label={t("providers:google.realtimeTranscription.languageCodes")}
            placeholder="en-US, nl-NL"
            rows={3}
            value={(transcription.languageCodes ?? []).join("\n")}
            onChange={(value) => updateTranscription({ languageCodes: parseList(String(value ?? "")) })}
          />

          <theme.TextArea
            label={t("providers:google.realtimeTranscription.customVocabulary")}
            placeholder="Gemini, Kubernetes, BigQuery"
            rows={4}
            value={(transcription.customVocabulary ?? []).join("\n")}
            onChange={(value) => updateTranscription({ customVocabulary: parseList(String(value ?? "")) })}
          />

          <theme.Select
            label={t("providers:google.realtimeTranscription.mode")}
            values={[mode]}
            valueTitle={t(`providers:google.realtimeTranscription.modes.${mode.toLowerCase()}`)}
            options={[
              {
                value: "VERBATIM",
                label: t("providers:google.realtimeTranscription.modes.verbatim"),
              },
              {
                value: "SMART",
                label: t("providers:google.realtimeTranscription.modes.smart"),
              },
            ]}
            onChange={(value: string) =>
              updateTranscription({ mode: value === "SMART" ? "SMART" : "VERBATIM" })
            }
          >
            <option value="VERBATIM">
              {t("providers:google.realtimeTranscription.modes.verbatim")}
            </option>
            <option value="SMART">
              {t("providers:google.realtimeTranscription.modes.smart")}
            </option>
          </theme.Select>
        </div>
      </theme.Card>
    </div>
  );
};
