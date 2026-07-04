import React from "react";
import { useTheme } from "../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import { VideoSizeSettingsForm } from "./VideoSizeSettingsForm";
import { VideoAspectRatioSettingsForm } from "./VideoAspectRatioSettingsForm";
import { AttachmentButton } from "../../buttons/AttachmentButton";
import { FileTags } from "../../fields/FileTags";

export type VideoSettings = {
  duration?: number;
  resolution?: string;
  fps?: number;
  aspectRatio?: string;
  n: number;
  seed?: number;
  maxVideosPerCall?: number;
};

export type VideoFrameType = "first_frame" | "last_frame";

export type VideoSettingsFileInfo = {
  id: string;
  /** Display label, typically the source filename. */
  name: string;
  /** MIME type used for previews and backend conversion. */
  mediaType?: string;
  /** Optional object URL for an image preview. */
  previewUrl?: string;
};

export type VideoFrameImageInfo = {
  frameType: VideoFrameType;
  file?: VideoSettingsFileInfo;
};

export type VideoSettingsFormProps = {
  value: VideoSettings;
  onChange: (next: VideoSettings) => void;
  inputReferences?: VideoSettingsFileInfo[];
  frameImages?: VideoFrameImageInfo[];
  onAddInputReferences?: (files: File[]) => void;
  onRemoveInputReference?: (id: string) => void;
  onSetFrameImage?: (frameType: VideoFrameType, files: File[]) => void;
  onRemoveFrameImage?: (frameType: VideoFrameType) => void;
};

const asImageFile = (file: VideoSettingsFileInfo) =>
  new File([], file.name, { type: file.mediaType ?? "image/*" });

const pickDroppedFiles = (e: React.DragEvent<HTMLDivElement>) =>
  e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : [];

const frameTypes: VideoFrameType[] = ["first_frame", "last_frame"];

export const VideoSettingsForm: React.FC<VideoSettingsFormProps> = ({
  value,
  onChange,
  inputReferences = [],
  frameImages = [],
  onAddInputReferences,
  onRemoveInputReference,
  onSetFrameImage,
  onRemoveFrameImage,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const findFrameImage = (frameType: VideoFrameType) =>
    frameImages.find((frame) => frame.frameType === frameType)?.file;

  const renderDropHint = (label: string) => (
    <theme.Text as="p" size={200} style={styles.hintText}>
      {label}
    </theme.Text>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <VideoSizeSettingsForm
        value={{ resolution: value.resolution }}
        onChange={(next) => onChange({ ...value, resolution: next.resolution })}
      />

      <VideoAspectRatioSettingsForm
        value={{ aspectRatio: value.aspectRatio }}
        onChange={(next) => onChange({ ...value, aspectRatio: next.aspectRatio })}
      />

      <theme.Card size="small" title={t("videoSettings.output")}>
        <div>
          <theme.Slider
            label={t("videoSettings.n", { n: value.n })}
            min={1}
            max={10}
            value={value.n ?? 1}
            onChange={(e: number) => {
              onChange({ ...value, n: e });
            }}
          />

          <theme.Input
            label={t("videoSettings.maxVideosPerCall")}
            type="number"
            value={String(value.maxVideosPerCall ?? "")}
            onChange={(e: any) => {
              const next = e.target.value ? Number(e.target.value) : undefined;
              onChange({ ...value, maxVideosPerCall: next });
            }}
          />
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("videoSettings.inputReferences")}>
        <div
          style={styles.dropZone}
          onDrop={(e) => {
            e.preventDefault();
            const files = pickDroppedFiles(e);
            if (files.length) onAddInputReferences?.(files);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <div style={styles.fileControlsRow}>
            <AttachmentButton
              disabled={!onAddInputReferences}
              icon="attachment"
              onFilesSelected={onAddInputReferences ?? (() => undefined)}
            />
            <div style={styles.fileTextColumn}>
              <theme.Text as="span" size={300} weight="semibold">
                {t("videoSettings.addInputReferences")}
              </theme.Text>
              {renderDropHint(t("videoSettings.inputReferencesHint"))}
            </div>
          </div>

          {inputReferences.length > 0 ? (
            <div style={styles.referenceGrid}>
              {inputReferences.map((file) => (
                <div key={file.id} style={styles.referenceTile}>
                  {file.previewUrl ? (
                    <theme.Image
                      src={file.previewUrl}
                      fit="cover"
                      shape="rounded"
                      style={styles.referencePreview}
                      title={file.name}
                    />
                  ) : (
                    <div style={styles.emptyPreview}>{t("image")}</div>
                  )}

                  <div style={styles.referenceTileFooter}>
                    <div style={styles.tagContainer}>
                      <FileTags
                        size="extra-small"
                        icon="image"
                        files={[asImageFile(file)]}
                      />
                    </div>
                    <theme.Button
                      type="button"
                      size="small"
                      variant="subtle"
                      icon="dismiss"
                      disabled={!onRemoveInputReference}
                      onClick={() => onRemoveInputReference?.(file.id)}
                      title={t("delete")}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>{t("videoSettings.noInputReferences")}</div>
          )}
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("videoSettings.frameImages")}>
        <div style={styles.frameGrid}>
          {frameTypes.map((frameType) => {
            const frameFile = findFrameImage(frameType);
            const title = t(`videoSettings.${frameType}`);

            return (
              <div
                key={frameType}
                style={styles.frameDropZone}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = pickDroppedFiles(e);
                  if (files.length) onSetFrameImage?.(frameType, files);
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                <div style={styles.frameHeader}>
                  <theme.Text as="span" size={300} weight="semibold">
                    {title}
                  </theme.Text>
                  <div style={styles.frameActions}>
                    <AttachmentButton
                      disabled={!onSetFrameImage}
                      icon="attachment"
                      onFilesSelected={(files) => onSetFrameImage?.(frameType, files)}
                    />
                    <theme.Button
                      type="button"
                      size="small"
                      variant="subtle"
                      icon="dismiss"
                      disabled={!frameFile || !onRemoveFrameImage}
                      onClick={() => onRemoveFrameImage?.(frameType)}
                      title={t("delete")}
                    />
                  </div>
                </div>

                {frameFile?.previewUrl ? (
                  <theme.Image
                    src={frameFile.previewUrl}
                    fit="cover"
                    shape="rounded"
                    style={styles.framePreview}
                    title={frameFile.name}
                  />
                ) : (
                  <div style={styles.frameEmptyPreview}>{t("videoSettings.dropFrameImage")}</div>
                )}

                {frameFile ? (
                  <FileTags
                    size="extra-small"
                    icon="image"
                    files={[asImageFile(frameFile)]}
                  />
                ) : (
                  renderDropHint(t("videoSettings.frameImageHint"))
                )}
              </div>
            );
          })}
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("videoSettings.other")}>
        <div>
          <theme.Input
            label={t("videoSettings.duration")}
            type="number"
            value={value.duration === undefined ? "" : String(value.duration)}
            onChange={(e: any) => {
              const raw = String(e.target.value ?? "").trim();
              if (!raw) {
                onChange({ ...value, duration: undefined });
                return;
              }
              const parsed = Number(raw);
              onChange({
                ...value,
                duration: Number.isFinite(parsed) ? parsed : undefined,
              });
            }}
          />

          <theme.Input
            label={t("videoSettings.fps")}
            type="number"
            value={value.fps === undefined ? "" : String(value.fps)}
            onChange={(e: any) => {
              const raw = String(e.target.value ?? "").trim();
              if (!raw) {
                onChange({ ...value, fps: undefined });
                return;
              }
              const parsed = Number(raw);
              onChange({
                ...value,
                fps: Number.isFinite(parsed) ? parsed : undefined,
              });
            }}
          />


          <theme.Input
            label={t("videoSettings.seed")}
            type="number"
            value={value.seed === undefined ? "" : String(value.seed)}
            onChange={(e: any) => {
              const raw = String(e.target.value ?? "").trim();
              if (!raw) {
                onChange({ ...value, seed: undefined });
                return;
              }
              const parsed = Number(raw);
              onChange({
                ...value,
                seed: Number.isFinite(parsed) ? parsed : undefined,
              });
            }}
          />

        </div>
      </theme.Card>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  dropZone: {
    border: "1px dashed rgba(127,127,127,0.45)",
    borderRadius: 10,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  fileControlsRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  fileTextColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  hintText: {
    margin: 0,
    opacity: 0.72,
  },
  referenceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(124px, 1fr))",
    gap: 12,
  },
  referenceTile: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  referencePreview: {
    width: "100%",
    aspectRatio: "1 / 1",
    objectFit: "cover",
    border: "1px solid rgba(127,127,127,0.25)",
  },
  emptyPreview: {
    aspectRatio: "1 / 1",
    borderRadius: 8,
    border: "1px solid rgba(127,127,127,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.72,
  },
  referenceTileFooter: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  tagContainer: {
    minWidth: 0,
    flex: 1,
  },
  emptyState: {
    padding: "10px 0",
    opacity: 0.72,
  },
  frameGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  frameDropZone: {
    border: "1px dashed rgba(127,127,127,0.45)",
    borderRadius: 10,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minWidth: 0,
  },
  frameHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  frameActions: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  framePreview: {
    width: "100%",
    aspectRatio: "16 / 9",
    objectFit: "cover",
    border: "1px solid rgba(127,127,127,0.25)",
  },
  frameEmptyPreview: {
    aspectRatio: "16 / 9",
    borderRadius: 8,
    border: "1px solid rgba(127,127,127,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: 12,
    opacity: 0.72,
  },
};
