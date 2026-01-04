import { ModelSelect } from "../models/ModelSelect";
import { useAppStore } from "aihappey-state";
import { useState } from "react";
import { useChatContext } from "../chat/context/ChatContext";
import { useChatFileDrop } from "../chat/input/useChatFileDrop";
import { createTranscriptionProvider } from "aihappey-ai";
import { useTranscriptions } from "aihappey-transcriptions";
import { TranscriptionCard, useTheme } from "aihappey-components";
import { TranscriptionInput } from "./TranscriptionInput";

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });


export const TranscriptionsPage = () => {
  const models = useAppStore((a) => a.models);
  const customHeaders = useAppStore((a) => a.customHeaders);
  const providerImageMetadata = useAppStore((a) => a.providerImageMetadata);
  const { config } = useChatContext();
  const [itemsLoading, setItemsLoading] = useState<number>(0);
  const getAccessToken = config?.getAccessToken;
  const [selectedModel, setSelectedModel] = useState<string>(getAccessToken ?
    "openai/gpt-4o-transcribe-diarize" : "pollinations/openai");
  const headers = config?.headers;
  const { Skeleton } = useTheme()
  const storageTranscriptions = useTranscriptions()

  //const attachments = useFileAttachments(fileAttachmentRuntime);
  const addAttachment = async (file: File) => {
    await transcribeFiles([file]);
  };

  const { isOver, dropRef, handleDrop, handleDragOver } =
    useChatFileDrop(addAttachment);
    
  const [processing, setProcessing] = useState(false);
  const transcribeFiles = async (files: File[]) => {
    if (!files.length) return;

    setProcessing(true);
    setItemsLoading(files.length);

    try {
      let merged = { ...(headers ?? {}), ...(customHeaders ?? {}) };

      if (getAccessToken) {
        merged.Authorization = `Bearer ${await getAccessToken()}`;
      }

      const provider = createTranscriptionProvider({
        baseUrl: config.api?.replace("/api/chat", "") ?? "",
        headers: merged,
      });

      const model = provider.transcriptionModel(selectedModel);

      await Promise.all(
        files.map(async (file) => {
          const audioBase64 = await fileToBase64(file);

          const result = await model.doGenerate({
            audio: audioBase64,
            mediaType: file.type,
            providerOptions: providerImageMetadata,
          });

          await storageTranscriptions.add(file.name, file, result);
        })
      );

      storageTranscriptions.refresh();
    } finally {
      setProcessing(false);
      setItemsLoading(0);
    }
  };

  const cellStyle: React.CSSProperties = {
    width: "100%",
    aspectRatio: "1 / 1",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 76
  };

  return (
    <div
      style={{
        background: "transparent",
        width: "100%",
      }}
    >
      <div style={{ paddingLeft: 12, paddingRight: 12 }}>

        <ModelSelect
          models={models ?? []}
          modelTypes={["transcription"]}
          value={selectedModel ?? ""}
          onChange={setSelectedModel}
        />
      </div>

      <div style={{
        marginTop: 44,
        border: isOver ? "2px dotted" : undefined,
        borderColor: isOver ? "#888" : "transparent",
      }}
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}>

        <TranscriptionInput
          disabled={processing}
          onFilesSelected={transcribeFiles}
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

          {storageTranscriptions.items.map(a => (
            <TranscriptionCard
              key={a.id ?? a.name}
              transcription={a.transcription}
              filename={a.name}
              file={a.blob}
              onDelete={a.id ? () => storageTranscriptions.delete(a.id) : undefined}
            />
          ))}
        </div>
      </div>


    </div>
  );
};
