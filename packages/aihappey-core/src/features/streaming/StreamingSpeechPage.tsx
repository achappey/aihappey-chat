import { useCallback, useEffect, useRef, useState } from "react";
import { ErrorAlerts, ModelFavoriteToggleButton, useTheme } from "aihappey-components";
import { useFiles } from "aihappey-files";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import {
  base64ToUint8Array,
  concatUint8Arrays,
  createTimestampedFileName,
  getOpenAISpeechFormatInfo,
  OPENAI_SPEECH_FORMATS,
  pcm16ToWav,
  readOpenAISse,
  type OpenAISpeechFormat,
  type OpenAISpeechStreamEvent,
} from "aihappey-ai";
import { ModelSelect } from "../models/ModelSelect";
import { UserMenuInline } from "../user-settings/UserMenuInline";
import { useChatContext } from "../chat/context/ChatContext";
import { buildStreamingHeaders, resolveStreamingUrl, streamingErrorMessage } from "./streamingRequest";
import { StreamingAudioVisualizer } from "./StreamingAudioVisualizer";
import { createStreamingAudioPlayback, type StreamingAudioPlayback } from "./streamingAudioPlayback";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import { usePromptDictationControls } from "../chat/input/usePromptDictationControls";

type Settings = { voice: string; responseFormat: OpenAISpeechFormat; instructions: string; speed: string };

export const StreamingSpeechPage = () => {
  const isDesktop = useIsDesktop();
  const { t } = useTranslation();
  const { config } = useChatContext();
  const { AudioPlayer, Button, Input, Modal, Select, Slider, TextArea } = useTheme();
  const models = useAppStore((state) => state.models);
  const customHeaders = useAppStore((state) => state.customHeaders);
  const preferredModel = useAppStore((state) => state.userPreferredSpeechModel);
  const favoriteModelsByType = useAppStore((state: any) => state.favoriteModelsByType as Record<string, string[]> | undefined);
  const toggleFavoriteModelForType = useAppStore((state: any) => state.toggleFavoriteModelForType as (type: string, modelId: string) => void);
  const files = useFiles();
  const [selectedModel, setSelectedModel] = useState(preferredModel ?? (config.getAccessToken ? "openai/gpt-4o-mini-tts" : ""));
  const [text, setText] = useState("");
  const [settings, setSettings] = useState<Settings>({ voice: "", responseFormat: "mp3", instructions: "", speed: "1" });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Array<{ id: string; message: string }>>([]);
  const [analyser, setAnalyser] = useState<AnalyserNode>();
  const [receivedBytes, setReceivedBytes] = useState(0);
  const [completedAudioUrl, setCompletedAudioUrl] = useState<string>();
  const completedAudioUrlRef = useRef<string>(null);
  const abortRef = useRef<AbortController>(null);
  const playbackRef = useRef<StreamingAudioPlayback>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { dictationButton, dictationError } = usePromptDictationControls({
    value: text,
    onChange: setText,
    textareaRef,
    disabled: processing,
  });

  const addError = useCallback((message: string) => {
    if (message) setErrors((current) => [...current, { id: crypto.randomUUID(), message }]);
  }, []);

  useEffect(() => () => {
    abortRef.current?.abort();
    playbackRef.current?.dispose();
    if (completedAudioUrlRef.current) URL.revokeObjectURL(completedAudioUrlRef.current);
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim() || !selectedModel || processing) return;

    abortRef.current?.abort();
    playbackRef.current?.dispose();
    playbackRef.current = null;
    setAnalyser(undefined);
    if (completedAudioUrlRef.current) {
      URL.revokeObjectURL(completedAudioUrlRef.current);
      completedAudioUrlRef.current = null;
      setCompletedAudioUrl(undefined);
    }
    const abort = new AbortController();
    abortRef.current = abort;
    // A fresh element per invocation avoids the Web Audio rule that permits only
    // one MediaElementSourceNode for a given HTMLMediaElement.
    const progressiveAudio = new Audio();
    progressiveAudio.autoplay = true;
    const playback = createStreamingAudioPlayback(settings.responseFormat, progressiveAudio);
    playbackRef.current = playback;
    setAnalyser(playback.analyser);
    setReceivedBytes(0);
    setProcessing(true);
    const chunks: Uint8Array[] = [];

    try {
      const headers = await buildStreamingHeaders(config, customHeaders);
      headers.set("Content-Type", "application/json");

      await readOpenAISse<OpenAISpeechStreamEvent>({
        url: resolveStreamingUrl(config.baseUrl, config.endpoints.oaiSpeech),
        fetch: config.fetch,
        signal: abort.signal,
        init: {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: selectedModel,
            input: text.trim(),
            voice: settings.voice.trim() || undefined,
            response_format: settings.responseFormat,
            instructions: settings.instructions.trim() || undefined,
            speed: settings.speed === "" ? undefined : Number(settings.speed),
            stream_format: "sse",
          }),
        },
        onEvent: (streamEvent) => {
          if (streamEvent.type !== "speech.audio.delta" || typeof streamEvent.audio !== "string") return;
          const chunk = base64ToUint8Array(streamEvent.audio);
          chunks.push(chunk);
          setReceivedBytes((current) => current + chunk.byteLength);
          playback.append(chunk);
        },
      });

      if (!chunks.length) throw new Error(t("streamingSpeech.emptyResult"));
      await playback.finish(chunks);
      const info = getOpenAISpeechFormatInfo(settings.responseFormat);
      const bytes = concatUint8Arrays(chunks);
      const blob = new Blob([bytes as BlobPart], { type: info.mimeType });
      const playerBytes = settings.responseFormat === "pcm" ? pcm16ToWav(bytes) : bytes;
      const playerMimeType = settings.responseFormat === "pcm" ? "audio/wav" : info.mimeType;
      const finalUrl = URL.createObjectURL(new Blob([playerBytes as BlobPart], { type: playerMimeType }));
      completedAudioUrlRef.current = finalUrl;
      setCompletedAudioUrl(finalUrl);
      await files.create({
        name: createTimestampedFileName(t("streamingSpeech.filePrefix"), info.extension),
        mimeType: info.mimeType,
        data: blob,
      });
      files.refresh();
    } catch (error) {
      addError(streamingErrorMessage(error, t("streamingSpeech.failed")));
    } finally {
      if (abortRef.current === abort) abortRef.current = null;
      setProcessing(false);
    }
  };

  const currentModel = models?.find((model) => model.id === selectedModel);
  const isFavorite = !!selectedModel && (favoriteModelsByType?.speech ?? []).includes(selectedModel);

  return (
    <div style={{
      width: "100%",
      paddingLeft: isDesktop ? 0 : 12,
      paddingRight: isDesktop ? 0 : 12,
      boxSizing: "border-box",
    }}>
      <div style={{ ...styles.header, padding: isDesktop ? "0 12px" : 0 }}>
        <ModelSelect models={models ?? []} modelTypes={["speech"]} value={selectedModel} onChange={setSelectedModel} />
        <ModelFavoriteToggleButton
          variant="subtle"
          size="small"
          isFavorite={isFavorite}
          modelName={currentModel?.name ?? selectedModel}
          onToggleFavorite={() => selectedModel && toggleFavoriteModelForType("speech", selectedModel)}
          disabled={!selectedModel}
        />
        <div style={{ flex: 1 }} />
        <UserMenuInline />
      </div>

      <ErrorAlerts errors={errors} dismissError={(id) => setErrors((current) => current.filter((error) => error.id !== id))} />

      <form onSubmit={submit} style={styles.form}>
        <h1>{t("speech")}</h1>
        <TextArea ref={textareaRef} value={text} autoFocus onChange={setText} placeholder={t("speechPromptPlaceholder")} style={{ resize: "vertical", maxHeight: 160 }} />
        <div style={styles.buttonRow}>
          <Button type="button" size="large" variant="transparent" icon="speechSettings" title={t("settings")} onClick={() => setSettingsOpen(true)} />
          <div style={{ flex: 1 }} />
          {processing && <Button type="button" size="large" icon="stop" title={t("stop")} onClick={() => abortRef.current?.abort()} />}
          {dictationButton}
          <Button type="submit" size="large" icon="send" disabled={processing || !text.trim() || !selectedModel} />
        </div>
        {dictationError}
      </form>

      <section style={{ ...styles.output, padding: isDesktop ? "0 12px" : 0 }} aria-live="polite" aria-busy={processing}>
        <div style={styles.visualizer}>
          <StreamingAudioVisualizer analyser={analyser} />
          {completedAudioUrl && <AudioPlayer src={completedAudioUrl} style={{ width: "100%" }} />}
          {processing && <div>{t("streamingSpeech.receiving", { bytes: receivedBytes })}</div>}
        </div>
      </section>

      <Modal show={settingsOpen} onHide={() => setSettingsOpen(false)} title={t("streamingSpeech.settings")} actions={<Button onClick={() => setSettingsOpen(false)}>{t("close")}</Button>}>
        <div style={styles.settings}>
          <Input label={t("speechSettings.voice")} value={settings.voice} onChange={(event: any) => setSettings({ ...settings, voice: event.target.value })} />
          <Select
            label={t("outputFormat")}
            values={[settings.responseFormat]}
            valueTitle={settings.responseFormat.toUpperCase()}
            onChange={(value: string) => setSettings({ ...settings, responseFormat: value as OpenAISpeechFormat })}
          >
            {OPENAI_SPEECH_FORMATS.map((value) => (
              <option key={value} value={value}>{value.toUpperCase()}</option>
            ))}
          </Select>
          <Slider id="streaming-speech-speed" label={t("speechSettings.speed", { speed: settings.speed || 1 })} min={0.25} max={4} step={0.05} value={Number(settings.speed)} onChange={(value: number) => setSettings({ ...settings, speed: String(value) })} showValue />
          <TextArea label={t("instructions")} rows={4} value={settings.instructions} onChange={(value: string) => setSettings({ ...settings, instructions: value })} />
        </div>
      </Modal>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: { padding: "0 12px", display: "flex", alignItems: "center", gap: 8 },
  form: { maxWidth: 1056, margin: "44px auto 0", display: "flex", flexDirection: "column", gap: 8, width: "100%" },
  buttonRow: { display: "flex", alignItems: "center", gap: 8 },
  output: { maxWidth: 1056, margin: "44px auto 0", padding: "0 12px" },
  visualizer: { minHeight: 180, padding: 16, display: "flex", flexDirection: "column", gap: 12, borderRadius: 8 },
  settings: { display: "flex", flexDirection: "column", gap: 16 },
};
