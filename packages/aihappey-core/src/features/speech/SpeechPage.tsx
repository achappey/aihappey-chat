import { ModelSelect } from "../models/ModelSelect";
import { useAppStore } from "aihappey-state";
import { useCallback, useEffect, useState } from "react";
import { useChatContext } from "../chat/context/ChatContext";
import { useChatFileDrop } from "../chat/input/useChatFileDrop";
import { createSpeechProvider } from "aihappey-ai";
import { ErrorAlerts, ModelFavoriteToggleButton, SpeechCard, useTheme, WarningAlerts } from "aihappey-components";
import { SpeechInput } from "./SpeechInput";
import { fileAttachmentRuntime } from "../../runtime/files/fileAttachmentRuntime";
import { useSpeech } from "aihappey-speech";
import { speechFilesToPromptText } from "./speechFilesToPromptText";
import { UserMenuInline } from "../user-settings/UserMenuInline";
import { useSpeechErrors } from "./useSpeechErrors";
import { useStorageErrorMessage } from "../storage/storageErrorMessage";
import { useTranslation } from "aihappey-i18n";
import { useProviderRegistry } from "../../runtime/providers/useProviderRegistry";
import { useQueryModelId } from "../models/queryModelSelection";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";

const getProviderOptionsForSelectedModel = (
  selectedModel: string | undefined,
  providerOptions: Record<string, any> | undefined
) => {
  const providerKey = selectedModel?.split("/")?.[0]?.trim().toLowerCase();
  if (!providerKey || !providerOptions) return undefined;

  const providerConfig = providerOptions[providerKey];
  if (providerConfig === undefined) return undefined;

  return { [providerKey]: providerConfig };
};

export const SpeechPage = () => {
  const isDesktop = useIsDesktop();
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
  const { t } = useTranslation();
  const userPreferredSpeechModel = useAppStore((a) => a.userPreferredSpeechModel);
  const getAccessToken = config?.getAccessToken;
  const queryModelId = useQueryModelId(models ?? [], "speech");
  const [selectedModel, setSelectedModel] = useState<string>(queryModelId ?? userPreferredSpeechModel ?? (getAccessToken ?
    "openai/gpt-4o-mini-tts" : ""));
  const selectedModelOption = models?.find((model) => model.id === selectedModel);
  const headers = config?.headers;
  const getStorageErrorMessage = useStorageErrorMessage();
  const { Skeleton } = useTheme()
  const providers = useProviderRegistry();
  const favoriteModelsByType = useAppStore((a: any) => a.favoriteModelsByType as Record<string, string[]> | undefined);
  const toggleFavoriteModelForType = useAppStore((a: any) => a.toggleFavoriteModelForType as (type: string, modelId: string) => void);
  const isFavorite = !!selectedModel && (favoriteModelsByType?.speech ?? []).includes(selectedModel);
  const speech = useSpeech();
  const {
    errors,
    warnings,
    addError,
    dismissError,
    addWarnings,
    dismissWarning,
  } = useSpeechErrors();

  useEffect(() => {
    if (queryModelId) setSelectedModel(queryModelId);
  }, [queryModelId]);

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

  const { isOver, dropRef: drop, handleDrop, handleDragOver } =
    useChatFileDrop(addAttachment);


  const dropRef = useCallback((node: HTMLDivElement | null) => {
    if (node) drop(node);
  }, [drop]);

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
      const scopedProviderOptions = getProviderOptionsForSelectedModel(
        selectedModel,
        providerSpeechMetadata
      );

      const result = await model.doGenerate({
        text,
        voice,
        outputFormat,
        instructions,
        speed,
        language,
        providerOptions: scopedProviderOptions,
      });

      // Surface provider warnings (do NOT clear on new send; user dismisses).
      addWarnings(result.warnings);

      await speech.add(
        {
          model: selectedModel,
          text,
          voice,
          outputFormat,
          instructions,
          speed,
          language,
          providerOptions: scopedProviderOptions
        },
        result
      );
      speech.refresh();
    } catch (err: any) {
      // Bubble up backend errors into page-level errors
      addError(getStorageErrorMessage(err, "Speech request failed"));

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
        paddingLeft: isDesktop ? 0 : 12,
        paddingRight: isDesktop ? 0 : 12,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          paddingLeft: isDesktop ? 12 : 0,
          paddingRight: isDesktop ? 12 : 0,
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
        <div style={{ paddingLeft: 8 }}>
          <ModelFavoriteToggleButton
            variant="subtle"
            size="small"
            isFavorite={isFavorite}
            modelName={selectedModelOption?.name ?? selectedModel}
            onToggleFavorite={() => selectedModel && toggleFavoriteModelForType("speech", selectedModel)}
            disabled={!selectedModel}
          />
        </div>
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
        padding: isDesktop ? "0 12px" : 0,
        boxSizing: "border-box",
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
              speechInput={item.input}
              speechItem={item}
              providers={providers}
              onDelete={() => {
                void (async () => {
                  try {
                    await speech.delete(item.id);
                  } catch (err) {
                    addError(getStorageErrorMessage(err, "Delete failed"));
                  }
                })();
              }}
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
