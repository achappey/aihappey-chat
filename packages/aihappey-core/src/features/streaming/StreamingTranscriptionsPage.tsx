import { useCallback, useEffect, useRef, useState } from "react";
import {
  AttachmentButton,
  ErrorAlerts,
  ModelFavoriteToggleButton,
  useTheme,
} from "aihappey-components";
import { useFiles } from "aihappey-files";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import {
  createTimestampedFileName,
  readOpenAISse,
  type OpenAITranscriptionStreamEvent,
} from "aihappey-ai";
import { ModelSelect } from "../models/ModelSelect";
import { UserMenuInline } from "../user-settings/UserMenuInline";
import { useChatContext } from "../chat/context/ChatContext";
import { useChatFileDrop } from "../chat/input/useChatFileDrop";
import { buildStreamingHeaders, resolveStreamingUrl, streamingErrorMessage } from "./streamingRequest";

type Settings = {
  language: string;
  prompt: string;
  responseFormat: "json" | "text" | "verbose_json";
  temperature: string;
  timestampGranularities: Array<"segment" | "word">;
};

const initialSettings: Settings = {
  language: "",
  prompt: "",
  responseFormat: "json",
  temperature: "",
  timestampGranularities: [],
};

const isMedia = (file: File) => file.type.startsWith("audio/") || file.type.startsWith("video/");

export const StreamingTranscriptionsPage = () => {
  const { t } = useTranslation();
  const { config } = useChatContext();
  const { Button, Input, Modal, Select, Switch } = useTheme();
  const models = useAppStore((state) => state.models);
  const customHeaders = useAppStore((state) => state.customHeaders);
  const preferredModel = useAppStore((state) => state.userPreferredTranscriptionModel);
  const favoriteModelsByType = useAppStore((state: any) => state.favoriteModelsByType as Record<string, string[]> | undefined);
  const toggleFavoriteModelForType = useAppStore((state: any) => state.toggleFavoriteModelForType as (type: string, modelId: string) => void);
  const files = useFiles();
  const [selectedModel, setSelectedModel] = useState(preferredModel ?? (config.getAccessToken ? "openai/gpt-4o-transcribe" : ""));
  const [selectedFile, setSelectedFile] = useState<File>();
  const [settings, setSettings] = useState(initialSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Array<{ id: string; message: string }>>([]);
  const abortRef = useRef<AbortController>(null);

  const addError = useCallback((message: string) => {
    if (message) setErrors((current) => [...current, { id: crypto.randomUUID(), message }]);
  }, []);

  const chooseFiles = useCallback((selected: File[]) => {
    const file = selected.find(isMedia);
    if (!file) {
      addError(t("streamingTranscriptions.unsupportedFile"));
      return;
    }
    setSelectedFile(file);
  }, [addError, t]);

  const { isOver, dropRef: registerDrop, handleDrop, handleDragOver } = useChatFileDrop((file) => chooseFiles([file]));
  const dropRef = useCallback((node: HTMLDivElement | null) => {
    if (node) registerDrop(node);
  }, [registerDrop]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile || !selectedModel || processing) return;

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;
    setTranscript("");
    setProcessing(true);
    let finalText = "";

    try {
      const body = new FormData();
      body.set("file", selectedFile);
      body.set("model", selectedModel);
      body.set("stream", "true");
      body.set("response_format", settings.responseFormat);
      if (settings.language.trim()) body.set("language", settings.language.trim());
      if (settings.prompt.trim()) body.set("prompt", settings.prompt.trim());
      if (settings.temperature !== "") body.set("temperature", settings.temperature);
      settings.timestampGranularities.forEach((value) => body.append("timestamp_granularities[]", value));

      const headers = await buildStreamingHeaders(config, customHeaders);
      headers.delete("Content-Type");

      await readOpenAISse<OpenAITranscriptionStreamEvent>({
        url: resolveStreamingUrl(config.baseUrl, config.endpoints.oaiTranscriptions),
        fetch: config.fetch,
        signal: abort.signal,
        init: { method: "POST", headers, body },
        onEvent: (streamEvent) => {
          if (streamEvent.type === "transcript.text.delta" && typeof streamEvent.delta === "string") {
            finalText += streamEvent.delta;
            setTranscript(finalText);
          } else if (streamEvent.type === "transcript.text.done" && typeof streamEvent.text === "string") {
            finalText = streamEvent.text;
            setTranscript(finalText);
          }
        },
      });

      if (!finalText.trim()) throw new Error(t("streamingTranscriptions.emptyResult"));
      const blob = new Blob([finalText], { type: "text/plain;charset=utf-8" });
      await files.create({
        name: createTimestampedFileName(t("streamingTranscriptions.filePrefix"), "txt"),
        mimeType: blob.type,
        data: blob,
      });
      files.refresh();
    } catch (error) {
      addError(streamingErrorMessage(error, t("streamingTranscriptions.failed")));
    } finally {
      if (abortRef.current === abort) abortRef.current = null;
      setProcessing(false);
    }
  };

  const currentModel = models?.find((model) => model.id === selectedModel);
  const isFavorite = !!selectedModel && (favoriteModelsByType?.transcription ?? []).includes(selectedModel);
  const toggleGranularity = (value: "segment" | "word", checked: boolean) => setSettings((current) => ({
    ...current,
    timestampGranularities: checked
      ? [...new Set([...current.timestampGranularities, value])]
      : current.timestampGranularities.filter((item) => item !== value),
  }));

  return (
    <div style={{ width: "100%" }}>
      <div style={styles.header}>
        <ModelSelect models={models ?? []} modelTypes={["transcription"]} value={selectedModel} onChange={setSelectedModel} />
        <ModelFavoriteToggleButton
          variant="subtle"
          size="small"
          isFavorite={isFavorite}
          modelName={currentModel?.name ?? selectedModel}
          onToggleFavorite={() => selectedModel && toggleFavoriteModelForType("transcription", selectedModel)}
          disabled={!selectedModel}
        />
        <div style={{ flex: 1 }} />
        <UserMenuInline />
      </div>

      <ErrorAlerts errors={errors} dismissError={(id) => setErrors((current) => current.filter((error) => error.id !== id))} />

      <div ref={dropRef} onDrop={handleDrop} onDragOver={handleDragOver} style={{ ...styles.drop, borderColor: isOver ? "#888" : "transparent" }}>
        <form onSubmit={submit} style={styles.form}>
          <h1>{t("transcriptions")}</h1>
          <div style={styles.fileName}>{selectedFile?.name ?? t("transcriptionDropPlaceholder")}</div>
          <div style={styles.buttonRow}>
            <AttachmentButton icon="attachment" onFilesSelected={chooseFiles} disabled={processing} />
            <Button type="button" size="large" variant="transparent" icon="transcriptionSettings" title={t("settings")} onClick={() => setSettingsOpen(true)} />
            <div style={{ flex: 1 }} />
            {processing && <Button type="button" size="large" icon="stop" title={t("stop")} onClick={() => abortRef.current?.abort()} />}
            <Button type="submit" size="large" icon="send" disabled={processing || !selectedFile || !selectedModel} />
          </div>
        </form>
      </div>

      <section style={styles.output} aria-live="polite" aria-busy={processing}>
        <h2>{t("streamingTranscriptions.output")}</h2>
        <div style={styles.transcript}>{transcript}</div>
      </section>

      <Modal show={settingsOpen} onHide={() => setSettingsOpen(false)} title={t("streamingTranscriptions.settings")} actions={<Button onClick={() => setSettingsOpen(false)}>{t("close")}</Button>}>
        <div style={styles.settings}>
          <Input label={t("language")} value={settings.language} onChange={(event: any) => setSettings({ ...settings, language: event.target.value })} />
          <Input label={t("instructions")} value={settings.prompt} onChange={(event: any) => setSettings({ ...settings, prompt: event.target.value })} />
          <Select
            label={t("streamingTranscriptions.responseFormat")}
            values={[settings.responseFormat]}
            valueTitle={settings.responseFormat}
            onChange={(value: string) => setSettings({ ...settings, responseFormat: value as Settings["responseFormat"] })}
          >
            {["json", "text", "verbose_json"].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </Select>
          <Input label={t("streamingTranscriptions.temperature")} type="number" min={0} max={1} step={0.1} value={settings.temperature} onChange={(event: any) => setSettings({ ...settings, temperature: event.target.value })} />
          <Switch id="streaming-transcriptions-segment" label={t("streamingTranscriptions.segmentTimestamps")} checked={settings.timestampGranularities.includes("segment")} onChange={(checked: boolean) => toggleGranularity("segment", checked)} />
          <Switch id="streaming-transcriptions-word" label={t("streamingTranscriptions.wordTimestamps")} checked={settings.timestampGranularities.includes("word")} onChange={(checked: boolean) => toggleGranularity("word", checked)} />
        </div>
      </Modal>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: { padding: "0 12px", display: "flex", alignItems: "center", gap: 8 },
  drop: { marginTop: 44, border: "2px dotted transparent" },
  form: { maxWidth: 1056, margin: "auto", display: "flex", flexDirection: "column", gap: 8, width: "100%" },
  fileName: { minHeight: 52, display: "flex", alignItems: "center" },
  buttonRow: { display: "flex", alignItems: "center", gap: 8 },
  output: { maxWidth: 1056, margin: "44px auto 0", padding: "0 12px" },
  transcript: { minHeight: 180, padding: 16, borderRadius: 8, whiteSpace: "pre-wrap" },
  settings: { display: "flex", flexDirection: "column", gap: 16 },
};
