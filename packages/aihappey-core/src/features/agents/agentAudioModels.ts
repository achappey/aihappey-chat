import type { Agent, AiModel, ModelOption, RemoteAgentModel } from "aihappey-types";
import { resolveSelectedAgentEntries } from "./agentSelection";
import { supportsOpenAiSpeech } from "../speech/realtime/openAiSpeechConfig";

/** Project capable audio models into this picker only, not the global Speech catalog. */
export const agentSpeechModelOptions = (models: ModelOption[]) => models.flatMap(model =>
    model.type === "speech" ? [model] : supportsOpenAiSpeech(model) ? [{ ...model, type: "speech" }] : []);

export const isRealtimeTranscriptionModel = (model?: ModelOption) =>
    model?.type === "transcription" && model.tags?.includes("real-time") === true;

export const getRealtimeAgentEntries = (agents: Agent[], remote: RemoteAgentModel[], models: ModelOption[]) =>
    resolveSelectedAgentEntries([
        ...agents.map(agent => `local:${agent.name}`), ...remote.map(agent => `remote:${agent.id}`),
    ], agents, remote).filter(entry => {
        const agent = entry.localAgent ?? entry.remoteAgentModel?.agent;
        return !!agent?.transcriptionModel?.id && models.some(model =>
            model.id === agent.transcriptionModel!.id && isRealtimeTranscriptionModel(model));
    });

/** Preserve opaque configuration on re-selection; never copy another provider's settings. */
export const selectAgentAudioModel = (previous: AiModel | undefined, id: string, type: string): AiModel | undefined =>
    !id ? undefined : previous?.id === id ? previous : {
        id, type,
        ...(previous?.id.split("/")[0] === id.split("/")[0]
            ? { providerMetadata: previous.providerMetadata, providerHeaders: previous.providerHeaders } : {}),
    };
