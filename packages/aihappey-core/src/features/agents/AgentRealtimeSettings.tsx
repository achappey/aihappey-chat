import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import type { Agent, ModelOption } from "aihappey-types";
import { ModelSelect } from "../models/ModelSelect";
import { agentSpeechModelOptions, isRealtimeTranscriptionModel, selectAgentAudioModel } from "./agentAudioModels";

export function AgentRealtimeSettings({ agent, models, onChange }: {
    agent: Agent; models: ModelOption[]; onChange: (agent: Agent) => void;
}) {
    const { Card, Input, TextArea } = useTheme();
    const { t } = useTranslation();
    const updateSpeech = (key: string, value: unknown) => onChange({ ...agent, speech: { ...agent.speech, [key]: value } });
    return <div style={{ display: "grid", gap: 12 }}>
        {(["transcription", "speech"] as const).map(type => {
            const selected = type === "transcription" ? agent.transcription : agent.speech?.model;
            return <Card key={type} title={t(`agentRealtime.${type}`)}>
                <ModelSelect label={t("model")} models={type === "transcription" ? models.filter(isRealtimeTranscriptionModel) : agentSpeechModelOptions(models)}
                    modelTypes={[type]} value={selected?.id ?? ""} autoSelectFallback={false}
                    allowNone
                    selectedOptions={selected ? [{ id: selected.id, name: selected.id, type, owned_by: "", tags: [] }] : []}
                    onChange={id => onChange(type === "transcription"
                        ? { ...agent, transcription: selectAgentAudioModel(selected, id, type) }
                        : { ...agent, speech: { ...agent.speech, model: selectAgentAudioModel(selected, id, type) } })} />
                {type === "speech" && <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                    <Input label={t("agentRealtime.voice")} value={agent.speech?.voice ?? ""}
                        placeholder={t("providerDefault")} onChange={event => updateSpeech("voice", event.target.value || undefined)} />
                    <TextArea label={t("agentRealtime.instructions")} value={agent.speech?.instructions ?? ""}
                        onChange={event => updateSpeech("instructions", event || undefined)} />
                    <Input label={t("agentRealtime.language")} value={agent.speech?.language ?? ""}
                        placeholder={t("providerDefault")} onChange={event => updateSpeech("language", event.target.value || undefined)} />
                    <Input label={t("agentRealtime.speed")} type="number" min={0.01} step={0.1}
                        value={agent.speech?.speed ?? ""} placeholder={t("providerDefault")}
                        onChange={event => updateSpeech("speed", event.target.value === "" ? undefined : Number(event.target.value))} />
                    <Input label={t("agentRealtime.outputFormat")} value={agent.speech?.outputFormat?.type ?? ""}
                        placeholder="audio/mpeg" onChange={event => updateSpeech("outputFormat", event.target.value
                            ? { ...agent.speech?.outputFormat, type: event.target.value } : undefined)} />
                    <Input label={t("agentRealtime.sampleRate")} type="number" min={1} step={1}
                        disabled={!agent.speech?.outputFormat?.type} value={agent.speech?.outputFormat?.rate ?? ""}
                        placeholder={t("providerDefault")} onChange={event => updateSpeech("outputFormat", {
                            ...agent.speech?.outputFormat, type: agent.speech?.outputFormat?.type ?? "",
                            rate: event.target.value === "" ? undefined : Number(event.target.value),
                        })} />
                    <div role="note">{t("agentRealtime.speechOptionsHint")}</div>
                </div>}
            </Card>;
        })}
    </div>;
}
