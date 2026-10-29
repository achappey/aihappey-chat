import React from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";

export const MistralRealtimeTranscriptionConfigForm = ({ config, updateConfig }: {
  config: { language?: string; context_bias?: string[]; target_streaming_delay_ms?: number };
  updateConfig: (value: typeof config) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  return <theme.Card size="small" title={t("mistralRealtime.title")} description={t("mistralRealtime.hint")}>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <theme.Input id="mistral-realtime-language" label={t("language")} value={config.language ?? ""}
        placeholder={t("providers:openai.transcriptionLanguagePlaceholder")}
        onChange={event => updateConfig({ ...config, language: event.target.value.trim().toLowerCase() || undefined })} />
      <theme.Input id="mistral-realtime-context-bias" label={t("mistralRealtime.terms")} value={(config.context_bias ?? []).join(", ")}
        onChange={event => updateConfig({ ...config, context_bias: event.target.value.split(",").map(term => term.trim()).filter(Boolean) })} />
      <theme.Input id="mistral-realtime-delay" label={t("mistralRealtime.delay")} type="number" min={80} max={2400} step={1}
        value={config.target_streaming_delay_ms ?? 480}
        onChange={event => updateConfig({ ...config, target_streaming_delay_ms: event.target.value === "" ? undefined : Number(event.target.value) })} />
    </div>
  </theme.Card>;
};
