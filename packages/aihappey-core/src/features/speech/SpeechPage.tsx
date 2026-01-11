import { ModelSelect } from "../models/ModelSelect";
import { useAppStore } from "aihappey-state";
import { useCallback, useState } from "react";
import { useChatContext } from "../chat/context/ChatContext";
import { useChatFileDrop } from "../chat/input/useChatFileDrop";
import { createSpeechProvider, SpeechResponse } from "aihappey-ai";
import { SpeechCard, useTheme } from "aihappey-components";
import { SpeechInput } from "./SpeechInput";
import { fileAttachmentRuntime } from "../../runtime/files/fileAttachmentRuntime";
import { useSpeech } from "aihappey-speech";
import { speechFilesToPromptText } from "./speechFilesToPromptText";
import { UserMenuInline } from "../user-settings/UserMenuInline";

export const SpeechPage = () => {
  const models = useAppStore((a) => a.models);
  const customHeaders = useAppStore((a) => a.customHeaders);
  const providerSpeechMetadata = useAppStore((a) => a.providerSpeechMetadata);
  const voice = useAppStore((a) => a.voice);
  const outputFormat = useAppStore((a) => a.speechOutputFormat);
  const instructions = useAppStore((a) => a.speechInstructions);
  const speed = useAppStore((a) => a.speed);
  const language = useAppStore((a) => a.speechLanguage);
  const { config } = useChatContext();
  const [itemsLoading, setItemsLoading] = useState<number>(0);
  const [prompt, setPrompt] = useState<string>("");
  const [dropError, setDropError] = useState<string | undefined>(undefined);

  const userPreferredSpeechModel = useAppStore((a) => a.userPreferredSpeechModel);
  const getAccessToken = config?.getAccessToken;
  const [selectedModel, setSelectedModel] = useState<string>(userPreferredSpeechModel ?? (getAccessToken ?
    "openai/gpt-4o-mini-tts" : ""));
  const headers = config?.headers;
  const { Skeleton } = useTheme()
  const speech = useSpeech();

  // Speech page file->prompt behavior.
  // No auto-send and no keeping files as attachments/tags.
  const handleFilesSelected = useCallback(async (files: File[]) => {
    // Ensure Speech page doesn't accumulate file tags from earlier actions.
    fileAttachmentRuntime.clear();
    setDropError(undefined);

    const { text, failures } = await speechFilesToPromptText(files);
    if (text) setPrompt(text);

    if (failures.length) {
      // Keep message short; prompt is updated only if at least one file extracted.
      const failedNames = failures.map((f) => f.fileName).join(", ");
      setDropError(`Some files could not be converted: ${failedNames}`);
    }
  }, []);

  const addAttachment = useCallback((file: File) => {
    void handleFilesSelected([file]);
  }, [handleFilesSelected]);

  const { isOver, dropRef, handleDrop, handleDragOver } =
    useChatFileDrop(addAttachment);

  const [processing, setProcessing] = useState(false);


  const sendSpeech = async (text: string) => {
    if (!text) return;

    setProcessing(true);
    setItemsLoading(1);

    try {
      let merged = { ...(headers ?? {}), ...(customHeaders ?? {}) };

      if (getAccessToken) {
        merged.Authorization = `Bearer ${await getAccessToken()}`;
      }

      const provider = createSpeechProvider({
        baseUrl: config.baseUrl + config.endpoints.speech,
        headers: merged,
      });

      const model = provider.speechModel(selectedModel);

      const result = await model.doGenerate({
        text,
        voice,
        outputFormat,
        instructions,
        speed,
        language,
        providerOptions: providerSpeechMetadata,
      });

      await speech.add(
        {
          text,
          voice,
          outputFormat,
          instructions,
          speed,
          language,
          providerOptions: providerSpeechMetadata
        },
        result
      );
      speech.refresh();
    } finally {
      setProcessing(false);
      setItemsLoading(0);
    }
  };



  return (
    <div
      style={{
        background: "transparent",
        width: "100%",
      }}
    >
      <div
        style={{
          paddingLeft: 12,
          paddingRight: 12,
          display: "flex",
          alignItems: "center",
        }}
      >
        <ModelSelect
          models={models ?? []}
          modelTypes={["speech"]}
          value={selectedModel ?? ""}
          onChange={setSelectedModel}
        />
        <div style={{ flex: 1 }} />
        <div style={{ paddingLeft: 16 }}>
          <UserMenuInline />
        </div>
      </div>

      <div style={{
        marginTop: 44,
        border: isOver ? "2px dotted" : undefined,
        borderColor: isOver ? "#888" : "transparent",
      }}
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}>

        {dropError ? (
          <div style={{ padding: "0 12px 8px 12px", color: "#b00020" }}>
            {dropError}
          </div>
        ) : null}

        <SpeechInput
          onSend={sendSpeech}
          selectedModel={selectedModel}
          value={prompt}
          onChange={setPrompt}
          onFilesSelected={handleFilesSelected}
        />

      </div>

      <div style={{
        maxWidth: 1056,
        margin: "0 auto",
        padding: "0 12px",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 16,
          alignItems: "stretch",
        }}>
          {Array.from({ length: itemsLoading }).map((_, i) => (
            <div key={`shimmer-${i}`} style={cellStyle}>
              <Skeleton style={{ width: "100%", height: "100%" }} />
            </div>
          ))}

          {speech.items.map((item) => (
            <SpeechCard
              key={item.id}
              speech={item.speechResponse}
              onDelete={() => speech.delete(item.id)}
            />
          ))}
        </div>
      </div>


    </div>
  );
};


const cellStyle: React.CSSProperties = {
  width: "100%",
  aspectRatio: "1 / 1",
  position: "relative",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: 99
};