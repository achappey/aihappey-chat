import React, { useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";

/** Keys intentionally match StepFun's speech request JSON. */
export type StepFunSpeechConfig = {
  volume?: number;
  sample_rate?: number;
  pronunciation_map?: {
    tone?: string[];
  };
};

const normalizeTone = (value: string) => value.trim();

export const StepFunSpeechConfigForm: React.FC<{
  config: StepFunSpeechConfig;
  updateConfig: (value: StepFunSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [newTone, setNewTone] = useState("");

  const tones = useMemo(
    () =>
      Array.from(
        new Set(
          (config.pronunciation_map?.tone ?? [])
            .map(normalizeTone)
            .filter(Boolean)
        )
      ),
    [config.pronunciation_map?.tone]
  );

  const updateNumber = (
    key: "volume" | "sample_rate",
    rawValue: unknown
  ) => {
    const raw = String(rawValue ?? "").trim();
    updateConfig({
      ...config,
      [key]: raw === "" ? undefined : Number(raw),
    });
  };

  const updateTones = (nextTones: string[]) => {
    const normalized = Array.from(
      new Set(nextTones.map(normalizeTone).filter(Boolean))
    );

    updateConfig({
      ...config,
      pronunciation_map: normalized.length ? { tone: normalized } : undefined,
    });
  };

  const addTone = () => {
    const tone = normalizeTone(newTone);
    if (!tone) return;
    updateTones([...tones, tone]);
    setNewTone("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("providers:stepfun.audioSettings")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            id="stepfun-speech-volume"
            type="number"
            min={0.1}
            max={2}
            step={0.1}
            label={t("providers:stepfun.volume")}
            placeholder={t("providers:stepfun.volumePlaceholder")}
            value={config.volume ?? ""}
            onChange={(event: any) => updateNumber("volume", event?.target?.value)}
          />

          <theme.Input
            id="stepfun-speech-sample-rate"
            type="number"
            min={8000}
            max={48000}
            step={1}
            label={t("providers:stepfun.sampleRate")}
            placeholder={t("providers:stepfun.sampleRatePlaceholder")}
            value={config.sample_rate ?? ""}
            onChange={(event: any) =>
              updateNumber("sample_rate", event?.target?.value)
            }
          />

          <div style={{ opacity: 0.8, fontSize: 12 }}>
            {t("providers:stepfun.sampleRateHint")}
          </div>
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("providers:stepfun.pronunciationMap")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ opacity: 0.8, fontSize: 12 }}>
            {t("providers:stepfun.toneHint")}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <theme.Input
                id="stepfun-speech-new-tone"
                value={newTone}
                label={t("providers:stepfun.addTone")}
                placeholder={t("providers:stepfun.addTonePlaceholder")}
                onChange={(event: any) => setNewTone(event?.target?.value ?? "")}
                onKeyDown={(event: any) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTone();
                  }
                }}
              />
            </div>
            <theme.Button
              icon="add"
              size="small"
              title={t("add")}
              variant="informative"
              disabled={!normalizeTone(newTone)}
              onClick={addTone}
            />
          </div>

          {tones.map((tone) => (
            <div
              key={tone}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                padding: "6px 0",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ fontFamily: "monospace", overflowWrap: "anywhere" }}>
                {tone}
              </div>
              <theme.Button
                size="small"
                variant="danger"
                title={t("delete")}
                onClick={() => updateTones(tones.filter((item) => item !== tone))}
              />
            </div>
          ))}
        </div>
      </theme.Card>
    </div>
  );
};
