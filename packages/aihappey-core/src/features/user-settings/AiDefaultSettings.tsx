import React, { useState } from "react";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";

import { ModelSelect } from "../models/ModelSelect";
import { useTheme } from "aihappey-components";

export const AiDefaultSettings: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { Switch } = theme;
  const models = useAppStore((s) => s.models);
  const selectedModel = useAppStore((s) => s.selectedModel);

  const [activeTab, setActiveTab] = useState("language");

  const userPreferredModel = useAppStore((s) => s.userPreferredModel);
  const setUserPreferredModel = useAppStore((s) => s.setUserPreferredModel);

  const userPreferredImageModel = useAppStore((s) => s.userPreferredImageModel);
  const setUserPreferredImageModel = useAppStore((s) => s.setUserPreferredImageModel);

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

