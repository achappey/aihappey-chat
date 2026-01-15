import { ModelSelect } from "../models/ModelSelect";
import { useAppStore } from "aihappey-state";
import { useCallback, useState } from "react";
import { useChatContext } from "../chat/context/ChatContext";
import { useChatFileDrop } from "../chat/input/useChatFileDrop";
import { createSpeechProvider } from "aihappey-ai";
import { ErrorAlerts, SpeechCard, useTheme, WarningAlerts } from "aihappey-components";
import { SpeechInput } from "./SpeechInput";
import { fileAttachmentRuntime } from "../../runtime/files/fileAttachmentRuntime";
import { useSpeech } from "aihappey-speech";
import { speechFilesToPromptText } from "./speechFilesToPromptText";
import { UserMenuInline } from "../user-settings/UserMenuInline";
import { useSpeechErrors } from "./useSpeechErrors";

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

  const userPreferredSpeechModel = useAppStore((a) => a.userPreferredSpeechModel);
  const getAccessToken = config?.getAccessToken;
  const [selectedModel, setSelectedModel] = useState<string>(userPreferredSpeechModel ?? (getAccessToken ?
    "openai/gpt-4o-mini-tts" : ""));
  const headers = config?.headers;
  const { Skeleton } = useTheme()
  const speech = useSpeech();
  const {
    errors,
    warnings,
    addError,
    dismissError,
    addWarnings,
    dismissWarning,
  } = useSpeechErrors();

  // Speech page file->prompt behavior.
  // No auto-send and no keeping files as attachments/tags.
  const handleFilesSelected = useCallback(async (files: File[]) => {
    // Ensure Speech page doesn't accumulate file tags from earlier actions.
    fileAttachmentRuntime.clear();

    const { text, failures } = await speechFilesToPromptText(files);
    if (text) setPrompt(text);

    if (failures.length) {
      // Keep message short; prompt is updated only if at least one file extracted.
      const failedNames = failures.map((f) => f.fileName).join(", ");
      addWarnings([
        {
          type: "other",
          message: `Some files could not be converted: ${failedNames}`,
        },
      ]);
    }
  }, [addWarnings]);

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

      // Surface provider warnings (do NOT clear on new send; user dismisses).
      addWarnings(result.warnings);

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
    } catch (err: any) {
      // Bubble up backend errors into page-level errors
      addError(err?.message ?? "Speech request failed");

      // If backend error includes warnings, surface them too
      addWarnings(err?.warnings as any);
      addWarnings(err?.response?.warnings as any);
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

      <ErrorAlerts errors={errors} dismissError={dismissError} />
      <WarningAlerts warnings={warnings} dismissWarning={dismissWarning} />

      <div style={{
        marginTop: 44,
        border: isOver ? "2px dotted" : undefined,
        borderColor: isOver ? "#888" : "transparent",
      }}
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}>

        <SpeechInput
          onSend={sendSpeech}
          selectedModel={selectedModel}
          value={prompt}
          onChange={setPrompt}
          onFilesSelected={handleFilesSelected}
          disabled={processing}
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
