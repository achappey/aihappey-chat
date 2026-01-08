import { ModelSelect } from "../models/ModelSelect";
import { useAppStore } from "aihappey-state";
import { useState } from "react";
import { useChatContext } from "../chat/context/ChatContext";
import { useChatFileDrop } from "../chat/input/useChatFileDrop";
import { createTranscriptionProvider } from "aihappey-ai";
import { useTranscriptions } from "aihappey-transcriptions";
import { TranscriptionCard, useTheme } from "aihappey-components";
import { TranscriptionInput } from "./TranscriptionInput";
import { fileToBase64 } from "../chat/files/file";
import { useFiles } from "aihappey-files";
import {
  deleteKnownSpeakerReferenceSamples,
  getLatestKnownSpeakerReferenceItem,
  migrateKnownSpeakerReferenceSample,
  saveKnownSpeakerReferenceSample,
} from "aihappey-files";
import { withOpenAiKnownSpeakerReferences } from "./knownSpeakersProviderMetadata";
import { UserMenuInline } from "../user-settings/UserMenuInline";

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error ?? new Error("Failed to read blob"));
    r.readAsDataURL(blob);
  });
}


export const TranscriptionsPage = () => {
  const models = useAppStore((a) => a.models);
  const customHeaders = useAppStore((a) => a.customHeaders);
  const providerTranscriptionMetadata = useAppStore((a) => a.providerTranscriptionMetadata);
  const userPreferredTranscriptionModel = useAppStore((a) => a.userPreferredTranscriptionModel);
  const { config } = useChatContext();
  const [itemsLoading, setItemsLoading] = useState<number>(0);
  const getAccessToken = config?.getAccessToken;
  const [selectedModel, setSelectedModel] = useState<string>(userPreferredTranscriptionModel
    ?? (getAccessToken ? "openai/gpt-4o-transcribe-diarize" : ""));
  const headers = config?.headers;
  const { Skeleton } = useTheme()
  const storageTranscriptions = useTranscriptions()
  const files = useFiles();

  const knownSpeakerSamples = {
    getSampleInfo: (speakerName: string) => {
      const item = getLatestKnownSpeakerReferenceItem(files.items, speakerName);
      return {
        exists: !!item,
        tagLabel: item?.name,
      };
    },
    onUploadSample: async (speakerName: string, selected: File[]) => {
      if (!selected.length) return;
      const file = selected[0];
      await saveKnownSpeakerReferenceSample(files, speakerName, file);
      files.refresh();
    },
    onClearSample: async (speakerName: string) => {
      await deleteKnownSpeakerReferenceSamples(files, speakerName);
      files.refresh();
    },
    onRenameSample: async (fromName: string, toName: string) => {
      await migrateKnownSpeakerReferenceSample(files, fromName, toName);
      files.refresh();
    },
    onPreviewSample: async (speakerName: string) => {
      const item = getLatestKnownSpeakerReferenceItem(files.items, speakerName);
      if (!item) return;
      const stored = await files.read(item.id);
      if (!stored) return;

      const url = URL.createObjectURL(stored.data);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      audio.onerror = () => URL.revokeObjectURL(url);
      void audio.play();
    },
  };

  //const attachments = useFileAttachments(fileAttachmentRuntime);
  const addAttachment = async (file: File) => {
    await transcribeFiles([file]);
  };

  const { isOver, dropRef, handleDrop, handleDragOver } =
    useChatFileDrop(addAttachment);

  const [processing, setProcessing] = useState(false);

  const knownSpeakerNames = providerTranscriptionMetadata?.openai?.known_speaker_names;

  const transcribeFiles = async (inputFiles: File[]) => {
    if (!inputFiles.length) return;

    setProcessing(true);
    setItemsLoading(inputFiles.length);

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

      const hydratedProviderOptions = await withOpenAiKnownSpeakerReferences(
        providerTranscriptionMetadata,
        {
          items: files.items,
          files,
          knownSpeakerNames,
        }
      );


      await Promise.all(
        inputFiles.map(async (file) => {
          const audioBase64 = await fileToBase64(file);

          const result = await model.doGenerate({
            audio: audioBase64,
            mediaType: file.type,
            providerOptions: {
              ...(hydratedProviderOptions ?? providerTranscriptionMetadata),
            },
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
          modelTypes={["transcription"]}
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

        <TranscriptionInput
          disabled={processing}
          onFilesSelected={transcribeFiles}
          knownSpeakerSamples={knownSpeakerSamples}
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

const cellStyle: React.CSSProperties = {
  width: "100%",
  aspectRatio: "1 / 1",
  position: "relative",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: 100
};
