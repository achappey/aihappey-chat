import React, { useState } from "react";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";

import { ModelSelect } from "../models/ModelSelect";
import { useTheme } from "aihappey-components";

export const AiDefaultSettings: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { Switch, Slider } = theme;
  const models = useAppStore((s) => s.models);
  const selectedModel = useAppStore((s) => s.selectedModel);

  const [activeTab, setActiveTab] = useState("language");

  const userPreferredModel = useAppStore((s) => s.userPreferredModel);
  const setUserPreferredModel = useAppStore((s) => s.setUserPreferredModel);

  const userPreferredImageModel = useAppStore((s) => s.userPreferredImageModel);
  const setUserPreferredImageModel = useAppStore((s) => s.setUserPreferredImageModel);

  const userPreferredAudioModel = useAppStore((s: any) => s.userPreferredAudioModel);
  const setUserPreferredAudioModel = useAppStore((s: any) => s.setUserPreferredAudioModel);

  const userPreferredVideoModel = useAppStore((s) => s.userPreferredVideoModel);
  const setUserPreferredVideoModel = useAppStore((s) => s.setUserPreferredVideoModel);

  const userPreferredSpeechModel = useAppStore((s) => s.userPreferredSpeechModel);
  const setUserPreferredSpeechModel = useAppStore((s) => s.setUserPreferredSpeechModel);

  const userPreferredTranscriptionModel = useAppStore((s) => s.userPreferredTranscriptionModel);
  const setUserPreferredTranscriptionModel = useAppStore((s) => s.setUserPreferredTranscriptionModel);

  const userPreferredRerankingModel = useAppStore((s) => s.userPreferredRerankingModel);
  const setUserPreferredRerankingModel = useAppStore((s) => s.setUserPreferredRerankingModel);

  const toggleChatWithImageModels = useAppStore((s) => s.toggleChatWithImageModels);
  const chatWithImageModels = useAppStore((s) => s.chatWithImageModels);

  const toggleChatWithVideoModels = useAppStore((s) => s.toggleChatWithVideoModels);
  const chatWithVideoModels = useAppStore((s) => s.chatWithVideoModels);

  const toggleChatWithSpeechModels = useAppStore((s: any) => s.toggleChatWithSpeechModels);
  const chatWithSpeechModels = useAppStore((s) => s.chatWithSpeechModels);

  const toggleChatWithTranscriptionModels = useAppStore((s: any) => s.toggleChatWithTranscriptionModels);
  const chatWithTranscriptionModels = useAppStore((s) => s.chatWithTranscriptionModels);
  const transcriptionFileSplitEnabled = useAppStore((s: any) => s.transcriptionFileSplitEnabled);
  const setTranscriptionFileSplitEnabled = useAppStore((s: any) => s.setTranscriptionFileSplitEnabled);
  const transcriptionFileSplitOverlapSeconds = useAppStore((s: any) => s.transcriptionFileSplitOverlapSeconds);
  const setTranscriptionFileSplitOverlapSeconds = useAppStore((s: any) => s.setTranscriptionFileSplitOverlapSeconds);
  const transcriptionFileSplitMaxSizeMb = useAppStore((s: any) => s.transcriptionFileSplitMaxSizeMb);
  const setTranscriptionFileSplitMaxSizeMb = useAppStore((s: any) => s.setTranscriptionFileSplitMaxSizeMb);

  // If the user has not yet chosen a preferred model, we display the currently
  // selected model as a reasonable default. Only userPreferredModel is updated
  // via this settings panel.
  const value = userPreferredModel ?? selectedModel ?? "";

  const formStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: "12px 0 0 0",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <theme.Tabs activeKey={activeTab} onSelect={setActiveTab}>
        <theme.Tab eventKey="language" title={t("language")}>
          <div style={formStyle}>
            <ModelSelect
              models={models ?? []}
              modelTypes={["language"]}
              value={value}
              label={t("settingsModal.defaultModel")}
              onChange={setUserPreferredModel}
            />
          </div>
        </theme.Tab>

        <theme.Tab eventKey="image" title={t("image")}>
          <div style={formStyle}>
            <ModelSelect
              models={models ?? []}
              modelTypes={["image"]}
              value={userPreferredImageModel ?? ""}
              label={t("settingsModal.defaultModel")}
              onChange={setUserPreferredImageModel}
            />

            <Switch
              id={"chatWithImageModels"}
              label={t("chatWithImageModels")}
              checked={chatWithImageModels ?? false}
              onChange={toggleChatWithImageModels}
            />
          </div>
        </theme.Tab>

        <theme.Tab eventKey="audio" title={t("realtime")}>
          <div style={formStyle}>
            <ModelSelect
              models={models ?? []}
              modelTypes={["audio"]}
              value={userPreferredAudioModel ?? ""}
              label={t("settingsModal.defaultModel")}
              onChange={setUserPreferredAudioModel}
            />
          </div>
        </theme.Tab>

        <theme.Tab eventKey="transcription" title={t("transcription")}>
          <div style={formStyle}>
            <ModelSelect
              models={models ?? []}
              modelTypes={["transcription"]}
              value={userPreferredTranscriptionModel ?? ""}
              label={t("settingsModal.defaultModel")}
              onChange={setUserPreferredTranscriptionModel}
            />

            <Switch
              id={"chatWithTranscriptionModels"}
              label={t("chatWithTranscriptionModels")}
              checked={chatWithTranscriptionModels ?? false}
              onChange={toggleChatWithTranscriptionModels}
            />

            <Switch
              id={"transcriptionFileSplitEnabled"}
              label={t("settingsModal.transcriptionFileSplitEnabled")}
              checked={transcriptionFileSplitEnabled ?? false}
              onChange={() => setTranscriptionFileSplitEnabled(!(transcriptionFileSplitEnabled ?? false))}
            />

            <Slider
              id="transcriptionFileSplitOverlapSeconds-slider"
              min={0}
              max={60}
              step={1}
              value={transcriptionFileSplitOverlapSeconds ?? 5}
              onChange={setTranscriptionFileSplitOverlapSeconds}
              label={t("settingsModal.transcriptionFileSplitOverlapSeconds")}
              disabled={!(transcriptionFileSplitEnabled ?? false)}
              showValue={true}
              valueFormat={(seconds) => `${seconds} s`}
            />

            <Slider
              id="transcriptionFileSplitMaxSizeMb-slider"
              min={1}
              max={100}
              step={1}
              value={transcriptionFileSplitMaxSizeMb ?? 25}
              onChange={setTranscriptionFileSplitMaxSizeMb}
              label={t("settingsModal.transcriptionFileSplitMaxSizeMb")}
              disabled={!(transcriptionFileSplitEnabled ?? false)}
              showValue={true}
              valueFormat={(mb) => `${mb} MB`}
            />
          </div>
        </theme.Tab>

        <theme.Tab eventKey="speech" title={t("speech")}>
          <div style={formStyle}>
            <ModelSelect
              models={models ?? []}
              modelTypes={["speech"]}
              value={userPreferredSpeechModel ?? ""}
              label={t("settingsModal.defaultModel")}
              onChange={setUserPreferredSpeechModel}
            />

            <Switch
              id={"chatWithSpeechModels"}
              label={t("chatWithSpeechModels")}
              checked={chatWithSpeechModels ?? false}
              onChange={toggleChatWithSpeechModels}
            />
          </div>
        </theme.Tab>



        <theme.Tab eventKey="reranking" title={t("reranking")}>
          <div style={formStyle}>
            <ModelSelect
              models={models ?? []}
              modelTypes={["reranking"]}
              value={userPreferredRerankingModel ?? ""}
              label={t("settingsModal.defaultModel")}
              onChange={setUserPreferredRerankingModel}
            />
          </div>
        </theme.Tab>

        <theme.Tab eventKey="video" title={t("video")}>
          <div style={formStyle}>
            <ModelSelect
              models={models ?? []}
              modelTypes={["video"]}
              value={userPreferredVideoModel ?? ""}
              label={t("settingsModal.defaultModel")}
              onChange={setUserPreferredVideoModel}
            />

            <Switch
              id={"chatWithVideoModels"}
              label={t("chatWithVideoModels")}
              checked={chatWithVideoModels ?? false}
              onChange={toggleChatWithVideoModels}
            />
          </div>
        </theme.Tab>

      </theme.Tabs>
    </div>
  );
};

