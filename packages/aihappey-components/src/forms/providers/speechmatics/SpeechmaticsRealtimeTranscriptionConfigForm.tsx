import React from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";

type Config = { region?: string; ttl?: number; transcription_config?: Record<string, any>;
  realtime_config?: Record<string, any>; agent_config?: Record<string, any> };

export const SpeechmaticsRealtimeTranscriptionConfigForm = ({ config, updateConfig }: {
  config: Config; updateConfig: (value: Config) => void;
}) => {
  const theme = useTheme(), { t } = useTranslation();
  const common = config.transcription_config ?? {}, realtime = config.realtime_config ?? {}, agent = config.agent_config ?? {};
  const update = (key: string, value: unknown) => updateConfig({ ...config, transcription_config: { ...common, [key]: value } });
  return <theme.Card size="small" title={t("speechmaticsRealtime.title")} description={t("speechmaticsRealtime.hint")}>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <theme.Select label={t("speechmaticsRealtime.region")} values={[config.region ?? "global"]} valueTitle={(config.region ?? "global").toUpperCase()}
        options={["global", "eu", "us", "au"].map(value => ({ value, label: value.toUpperCase() }))}
        onChange={(value: string) => updateConfig({ ...config, region: value })} />
      <theme.Input id="speechmatics-realtime-language" label={t("language")} value={common.language ?? "en"}
        onChange={event => update("language", event.target.value.trim() || undefined)} />
      <theme.Input id="speechmatics-realtime-hints" label={t("speechmaticsRealtime.languageHints")} value={(realtime.language_hints ?? []).join(", ")}
        onChange={event => updateConfig({ ...config, realtime_config: { ...realtime, language_hints: event.target.value.split(",").map(term => term.trim()).filter(Boolean) } })} />
      <theme.Input id="speechmatics-realtime-vocab" label={t("mistralRealtime.terms")} value={(common.additional_vocab ?? []).map((term: any) => typeof term === "string" ? term : term.content).join(", ")}
        onChange={event => update("additional_vocab", event.target.value.split(",").map(term => term.trim()).filter(Boolean))} />
      <theme.Select label={t("speechmaticsRealtime.diarization")} values={[common.diarization ?? "none"]} valueTitle={t(`speechmaticsRealtime.${common.diarization ?? "none"}`)}
        options={["none", "speaker"].map(value => ({ value, label: t(`speechmaticsRealtime.${value}`) }))} onChange={(value: string) => update("diarization", value)} />
      <theme.Input id="speechmatics-realtime-locale" label={t("speechmaticsRealtime.locale")} value={common.output_locale ?? ""}
        onChange={event => update("output_locale", event.target.value.trim() || undefined)} />
      <theme.Input id="speechmatics-realtime-delay" label={t("speechmaticsRealtime.delay")} type="number" min={.7} max={4} step={.1} value={realtime.max_delay ?? 4}
        onChange={event => updateConfig({ ...config, realtime_config: { ...realtime, max_delay: event.target.value === "" ? undefined : Number(event.target.value) } })} />
      <theme.Switch id="speechmatics-realtime-sentences" label={t("speechmaticsRealtime.sentences")} checked={agent.emit_sentences ?? false}
        onChange={emit_sentences => updateConfig({ ...config, agent_config: { ...agent, emit_sentences } })} />
      <theme.Input id="speechmatics-realtime-ttl" label={t("speechmaticsRealtime.ttl")} type="number" min={60} max={86400} step={1} value={config.ttl ?? 60}
        onChange={event => updateConfig({ ...config, ttl: event.target.value === "" ? undefined : Number(event.target.value) })} />
    </div>
  </theme.Card>;
};
