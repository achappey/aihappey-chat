import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import type { Agent, ModelOption } from "aihappey-types";
import { ModelSelect } from "../models/ModelSelect";
import { agentSpeechModelOptions, isRealtimeTranscriptionModel, selectAgentAudioModel } from "./agentAudioModels";

export function AgentRealtimeSettings({ agent, models, onChange }: {
    agent: Agent; models: ModelOption[]; onChange: (agent: Agent) => void;
}) {
    const { Card } = useTheme();
    const { t } = useTranslation();
    return <div style={{ display: "grid", gap: 12 }}>
        {(["transcription", "speech"] as const).map(type => {
            const field = type === "transcription" ? "transcriptionModel" : "speechModel";
            const selected = agent[field];
            return <Card key={type} title={t(`agentRealtime.${type}`)}>
                <ModelSelect label={t("model")} models={type === "transcription" ? models.filter(isRealtimeTranscriptionModel) : agentSpeechModelOptions(models)}
                    modelTypes={[type]} value={selected?.id ?? ""} autoSelectFallback={false}
                    allowNone
                    selectedOptions={selected ? [{ id: selected.id, name: selected.id, type, owned_by: "", tags: [] }] : []}
                    onChange={id => onChange({ ...agent, [field]: selectAgentAudioModel(selected, id, type) })} />
            </Card>;
        })}
    </div>;
}
