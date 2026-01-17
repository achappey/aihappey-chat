import { ModelSelect } from "../models/ModelSelect";
import { useAppStore } from "aihappey-state";
import { useState } from "react";
import { useChatContext } from "../chat/context/ChatContext";
import { useChatFileDrop } from "../chat/input/useChatFileDrop";
import { createTranscriptionProvider } from "aihappey-ai";
import type { SharedV3Warning } from "aihappey-ai";
import { useTranscriptions } from "aihappey-transcriptions";
import { ErrorAlerts, TranscriptionCard, useTheme, WarningAlerts } from "aihappey-components";
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
import { useTranscriptionErrors } from "./useTranscriptionErrors";
import { getTranscriptionErrorMessage } from "./transcriptionErrors";
import { TranscriptionWarnings } from "./TranscriptionWarnings";
import { useTranslation } from "aihappey-i18n";
import { useEffect } from "react";
import type { AihUiTheme } from "aihappey-types";
import { useRealtimeTranscriptionController } from "./realtime/useRealtimeTranscriptionController";

const isTranscribableMedia = (file: File) => {
  const t = file.type;
  return t.startsWith("audio/") || t.startsWith("video/");
};

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
  const [activeTab, setActiveTab] = useState<string>("recorded");
  const getAccessToken = config?.getAccessToken;
  const [selectedModel, setSelectedModel] = useState<string>(userPreferredTranscriptionModel
    ?? (getAccessToken ? "openai/gpt-4o-transcribe-diarize" : ""));
  const headers = config?.headers;
  const { Skeleton, Tabs, Tab } = useTheme() as unknown as Pick<AihUiTheme, "Skeleton" | "Tabs" | "Tab">;
  const { t } = useTranslation()
  const storageTranscriptions = useTranscriptions()
  const files = useFiles();
  const currentModel = models?.find(a => a.id == selectedModel);
  // Ensure we stop the realtime session when leaving the page.
  useEffect(() => {
    return () => {
      void realtimeController.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    errors,
    warnings,
    sharedWarnings,
    addError,
    addWarning,
    clearSharedWarnings,
    addSharedWarnings,
    dismissError,
    dismissWarning,
    dismissSharedWarning,
  } = useTranscriptionErrors();

  const realtimeController = useRealtimeTranscriptionController({
    config,
    selectedModel: currentModel,
    transcriptions: storageTranscriptions as any,
    onErrorAlert: addError,
  });

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

    const accepted = inputFiles.filter(isTranscribableMedia);
    const rejected = inputFiles.filter((f) => !isTranscribableMedia(f));

    if (rejected.length) {
      addWarning(t('transcriptionInputFilesNotSupported', { rejected: rejected.map((f) => f.name).join(", ") }))
    }

    if (!accepted.length) {
      return;
    }

    clearSharedWarnings();

    setProcessing(true);
    setItemsLoading(accepted.length);

    try {
      let merged = { ...(headers ?? {}), ...(customHeaders ?? {}) };

      if (getAccessToken) {
        merged.Authorization = `Bearer ${await getAccessToken()}`;
      }

      const provider = createTranscriptionProvider({
        baseUrl: config.baseUrl + config.endpoints.transcriptions,
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
        accepted.map(async (file) => {
          const audioBase64 = await fileToBase64(file);

          const result = await model.doGenerate({
            audio: audioBase64,
            mediaType: file.type,
            providerOptions: {
              ...(hydratedProviderOptions ?? providerTranscriptionMetadata),
            },
          });

          addSharedWarnings(result?.warnings as any);

          await storageTranscriptions.add(file.name, file, result);
        })
      );

      storageTranscriptions.refresh();
    } catch (err) {
      // Bubble up backend errors into page-level errors
      addError(getTranscriptionErrorMessage(err));

      // If backend error includes warnings, surface them too
      const anyErr: any = err;
      const extraWarnings = anyErr?.warnings as SharedV3Warning[] | undefined;
      if (extraWarnings?.length) {
        addSharedWarnings(extraWarnings);
      }

      // Some providers include warnings nested in response metadata
      const nested = anyErr?.response?.warnings as SharedV3Warning[] | undefined;
      if (nested?.length) {
        addSharedWarnings(nested);
      }
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

      <ErrorAlerts errors={errors} dismissError={dismissError} />
      <WarningAlerts warnings={warnings} dismissWarning={dismissWarning} />
      <TranscriptionWarnings warnings={sharedWarnings} dismissWarning={dismissSharedWarning} />

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
          realtime={{
            canStart: realtimeController.canStart,
            status: realtimeController.realtimeStatus,
            onStart: () => {
              setActiveTab("realtime");
              void realtimeController.start();
            },
            onStop: () => void realtimeController.stop(),
          }}
        />

      </div>

      <div style={{ maxWidth: 1056, margin: "0 auto", padding: "0 12px" }}>
        <Tabs activeKey={activeTab} onSelect={setActiveTab}>
          <Tab eventKey="recorded" title={t("myTranscriptions")}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 16,
              alignItems: "stretch",
              marginTop: 12,
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
          </Tab>
          <Tab eventKey="realtime" title={t('realtime')}>
            <div style={{ marginTop: 12 }}>
              <div style={{
                padding: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 8,
                minHeight: 120,
                whiteSpace: "pre-wrap",
              }}>
                {realtimeController.realtimeText || ""}
              </div>
            </div>
          </Tab>
        </Tabs>
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
  height: 120
};
