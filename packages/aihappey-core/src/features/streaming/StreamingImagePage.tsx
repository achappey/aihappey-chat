import { useCallback, useEffect, useRef, useState } from "react";
import { AttachmentButton, ErrorAlerts, FileTags, ImageGrid, ModelFavoriteToggleButton, useTheme } from "aihappey-components";
import { createTimestampedFileName, readOpenAISse } from "aihappey-ai";
import { useFiles } from "aihappey-files";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { useChatContext } from "../chat/context/ChatContext";
import { useChatFileDrop } from "../chat/input/useChatFileDrop";
import { ModelSelect } from "../models/ModelSelect";
import { UserMenuInline } from "../user-settings/UserMenuInline";
import { buildStreamingHeaders, resolveStreamingUrl, streamingErrorMessage } from "./streamingRequest";
import {
  imageRequestSettings,
  initialStreamingImageSettings,
  streamingImageBlob,
  toStreamingImage,
  type OpenAIImageStreamEvent,
  type StreamingImage,
  type StreamingImageSettings,
} from "./streamingImage";

type StreamingImagePageProps = { mode: "create" | "edit" };

const isImage = (file: File) => file.type.startsWith("image/");

export const StreamingImagePage = ({ mode }: StreamingImagePageProps) => {
  const { t } = useTranslation();
  const { config } = useChatContext();
  const { Button, Input, Modal, Select, Slider, TextArea } = useTheme();
  const models = useAppStore((state) => state.models);
  const customHeaders = useAppStore((state) => state.customHeaders);
  const preferredModel = useAppStore((state) => state.userPreferredImageModel);
  const favoriteModelsByType = useAppStore((state: any) => state.favoriteModelsByType as Record<string, string[]> | undefined);
  const toggleFavoriteModelForType = useAppStore((state: any) => state.toggleFavoriteModelForType as (type: string, modelId: string) => void);
  const files = useFiles();
  const [selectedModel, setSelectedModel] = useState(preferredModel ?? (config.getAccessToken ? "openai/gpt-image-1" : ""));
  const [prompt, setPrompt] = useState("");
  const [inputImages, setInputImages] = useState<File[]>([]);
  const [settings, setSettings] = useState<StreamingImageSettings>(initialStreamingImageSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [partialImage, setPartialImage] = useState<StreamingImage>();
  const [completedImages, setCompletedImages] = useState<StreamingImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Array<{ id: string; message: string }>>([]);
  const abortRef = useRef<AbortController>(null);
  const isEdit = mode === "edit";
  const prefix = isEdit ? "streamingImageEdit" : "streamingImageCreate";

  const addError = useCallback((message: string) => {
    if (message) setErrors((current) => [...current, { id: crypto.randomUUID(), message }]);
  }, []);

  const chooseFiles = useCallback((selected: File[]) => {
    const images = selected.filter(isImage);
    if (!images.length) {
      addError(t("streamingImageEdit.unsupportedFile"));
      return;
    }
    setInputImages((current) => [...current, ...images]);
  }, [addError, t]);

  const { isOver, dropRef: registerDrop, handleDrop, handleDragOver } = useChatFileDrop((file) => chooseFiles([file]));
  const dropRef = useCallback((node: HTMLDivElement | null) => {
    if (node) registerDrop(node);
  }, [registerDrop]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!prompt.trim() || !selectedModel || processing || (isEdit && !inputImages.length)) return;

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;
    setPartialImage(undefined);
    setCompletedImages([]);
    setProcessing(true);
    let completedImageCount = 0;

    try {
      const headers = await buildStreamingHeaders(config, customHeaders);
      const requestSettings = imageRequestSettings(settings);
      let body: BodyInit;

      if (isEdit) {
        const form = new FormData();
        inputImages.forEach((image) => form.append("image", image));
        form.set("model", selectedModel);
        form.set("prompt", prompt.trim());
        Object.entries(requestSettings).forEach(([key, value]) => {
          if (value !== undefined) form.set(key, String(value));
        });
        headers.delete("Content-Type");
        body = form;
      } else {
        headers.set("Content-Type", "application/json");
        body = JSON.stringify({ model: selectedModel, prompt: prompt.trim(), ...requestSettings });
      }

      await readOpenAISse<OpenAIImageStreamEvent>({
        url: resolveStreamingUrl(config.baseUrl, isEdit ? config.endpoints.oaiImageEdits : config.endpoints.oaiImageGeneration),
        fetch: config.fetch,
        signal: abort.signal,
        init: { method: "POST", headers, body },
        onEvent: async (streamEvent) => {
          const image = toStreamingImage(streamEvent, settings.outputFormat);
          if (!image) return;

          if (streamEvent.type.endsWith(".partial_image")) {
            setPartialImage(image);
            return;
          }
          if (!streamEvent.type.endsWith(".completed")) return;

          setPartialImage(undefined);
          setCompletedImages((current) => [...current, image]);
          completedImageCount += 1;
          const blob = streamingImageBlob(image);
          await files.create({
            name: createTimestampedFileName(t(`${prefix}.filePrefix`), image.outputFormat),
            mimeType: blob.type,
            data: blob,
          });
        },
      });

      if (!completedImageCount) throw new Error(t(`${prefix}.emptyResult`));
      files.refresh();
    } catch (error) {
      addError(streamingErrorMessage(error, t(`${prefix}.failed`)));
    } finally {
      if (abortRef.current === abort) abortRef.current = null;
      setProcessing(false);
    }
  };

  const currentModel = models?.find((model) => model.id === selectedModel);
  const isFavorite = !!selectedModel && (favoriteModelsByType?.image ?? []).includes(selectedModel);
  const pageTitle = t(`${prefix}.title`);
  const previewItems = [
    ...(partialImage ? [partialImage] : []),
    ...completedImages,
  ].map((image) => ({ data: image.data, mimeType: streamingImageBlob(image).type, type: "image" as const }));

  return (
    <div style={{ width: "100%" }}>
      <div style={styles.header}>
        <ModelSelect models={models ?? []} modelTypes={["image"]} value={selectedModel} onChange={setSelectedModel} />
        <ModelFavoriteToggleButton variant="subtle" size="small" isFavorite={isFavorite} modelName={currentModel?.name ?? selectedModel} onToggleFavorite={() => selectedModel && toggleFavoriteModelForType("image", selectedModel)} disabled={!selectedModel} />
        <div style={{ flex: 1 }} />
        <UserMenuInline />
      </div>

      <ErrorAlerts errors={errors} dismissError={(id) => setErrors((current) => current.filter((error) => error.id !== id))} />

      <div ref={isEdit ? dropRef : undefined} onDrop={isEdit ? handleDrop : undefined} onDragOver={isEdit ? handleDragOver : undefined} style={{ ...styles.drop, borderColor: isEdit && isOver ? "#888" : "transparent" }}>
        <form onSubmit={submit} style={styles.form}>
          <h1>{pageTitle}</h1>
          {isEdit && inputImages.length > 0 && <div style={styles.tagRow}>
            <FileTags icon="image" files={inputImages} removeFile={(name) => setInputImages((current) => current.filter((image) => image.name !== name))} />
          </div>}
          <TextArea value={prompt} autoFocus onChange={setPrompt} placeholder={t("imagePromptPlaceholder")} style={{ resize: "vertical", maxHeight: 160 }} />
          <div style={styles.buttonRow}>
            {isEdit && <AttachmentButton icon="attachment" onFilesSelected={chooseFiles} disabled={processing} />}
            <Button type="button" size="large" variant="transparent" icon="imageSettings" title={t("settings")} onClick={() => setSettingsOpen(true)} />
            <div style={{ flex: 1 }} />
            {processing && <Button type="button" size="large" icon="stop" title={t("stop")} onClick={() => abortRef.current?.abort()} />}
            <Button type="submit" size="large" icon="send" disabled={processing || !prompt.trim() || !selectedModel || (isEdit && !inputImages.length)} />
          </div>
        </form>
      </div>

      <section style={styles.output} aria-live="polite" aria-busy={processing}>
        <ImageGrid items={previewItems} shimmers={processing && !previewItems.length ? 1 : 0} columns={1} fit="contain" shape="rounded" style={{ width: "100%" }} />
      </section>

      <Modal show={settingsOpen} onHide={() => setSettingsOpen(false)} title={t(`${prefix}.settings`)} actions={<Button onClick={() => setSettingsOpen(false)}>{t("close")}</Button>}>
        <div style={styles.settings}>
          <Input label={t("streamingImage.size")} value={settings.size} onChange={(event: any) => setSettings({ ...settings, size: event.target.value })} />
          <Input label={t("streamingImage.count")} type="number" min={1} max={10} step={1} value={settings.n} onChange={(event: any) => setSettings({ ...settings, n: event.target.value })} />
          <Input label={t("streamingImage.quality")} value={settings.quality} onChange={(event: any) => setSettings({ ...settings, quality: event.target.value })} />
          <Select label={t("streamingImage.outputFormat")} values={[settings.outputFormat]} valueTitle={settings.outputFormat.toUpperCase()} onChange={(value: string) => setSettings({ ...settings, outputFormat: value as StreamingImageSettings["outputFormat"] })}>
            {(["png", "jpeg", "webp"] as const).map((value) => <option key={value} value={value}>{value.toUpperCase()}</option>)}
          </Select>
          <Slider id="streaming-image-partial-images" label={t("streamingImage.partialImages")} min={0} max={3} step={1} value={Number(settings.partialImages)} onChange={(value: number) => setSettings({ ...settings, partialImages: String(value) })} showValue />
        </div>
      </Modal>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: { padding: "0 12px", display: "flex", alignItems: "center", gap: 8 },
  drop: { marginTop: 44, border: "2px dotted transparent" },
  form: { maxWidth: 1056, margin: "auto", display: "flex", flexDirection: "column", gap: 8, width: "100%" },
  tagRow: { display: "flex", gap: 8, marginBottom: 4, width: "100%" },
  buttonRow: { display: "flex", alignItems: "center", gap: 8 },
  output: { maxWidth: 1056, margin: "44px auto 0", padding: "0 12px" },
  settings: { display: "flex", flexDirection: "column", gap: 16 },
};
