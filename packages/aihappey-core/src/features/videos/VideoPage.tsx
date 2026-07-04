import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import { ModelFavoriteToggleButton, VideoGrid, VideoModal } from "aihappey-components";
import { useLibraryVideos, type LibraryVideoItem } from "./useLibraryVideos";
import { VideoInput } from "./VideoInput";
import { ModelSelect } from "../models/ModelSelect";
import { useAppStore } from "aihappey-state";
import { useCallback, useMemo, useState } from "react";
import { useChatContext } from "../chat/context/ChatContext";
import { useVideos } from "aihappey-videos";
import { useVideoErrors } from "./useVideoErrors";
import { VideoErrors } from "./VideoErrors";
import { useChatFileDrop } from "../chat/input/useChatFileDrop";
import { VideoWarnings } from "./VideoWarnings";
import { createVideoProvider } from "aihappey-ai/src/createVideoProvider";
import { blobToBase64, fileToBase64 } from "../chat/files/file";
import { UserMenuInline } from "../user-settings/UserMenuInline";
import type { VideoContent } from "aihappey-components";
import { useStorageErrorMessage } from "../storage/storageErrorMessage";
import {
  isValidVideoAttachment,
  isValidVideoImageAttachment,
  toSingleVideoAttachment,
  VIDEO_INPUT_REFERENCE_PREFIX,
  videoFrameImageNamePrefix,
  videoFrameTypes,
} from "./videoAttachments";
import { useTranslation } from "aihappey-i18n";
import { useFiles } from "aihappey-files";

export const VideoPage = () => {
  const videos = useLibraryVideos();
  const isDesktop = useIsDesktop();
  const models = useAppStore((a) => a.models);
  const customHeaders = useAppStore((a) => a.customHeaders);
  const n = useAppStore((a: any) => a.n);
  const maxVideosPerCall = useAppStore((a: any) => a.maxVideosPerCall);
  const duration = useAppStore((a: any) => a.duration);
  const resolution = useAppStore((a: any) => a.resolution);
  const fps = useAppStore((a: any) => a.fps);
  const aspectRatio = useAppStore((a: any) => a.aspectRatio);
  const seed = useAppStore((a: any) => a.seed);
  const providerVideoMetadata = useAppStore((a: any) => a.providerVideoMetadata);
  const userPreferredVideoModel = useAppStore((a: any) => a.userPreferredVideoModel);
  const { config } = useChatContext();
  const [itemsLoading, setItemsLoading] = useState<number>(0);
  const storageVideos = useVideos();
  const files = useFiles();
  const { t } = useTranslation();
  const getAccessToken = config?.getAccessToken;
  const [selectedModel, setSelectedModel] = useState<string>(
    userPreferredVideoModel ??
    (getAccessToken ? "openai/sora-2" : "")
  );
  const selectedModelOption = models?.find((model) => model.id === selectedModel);
  const headers = config?.headers;
  const getStorageErrorMessage = useStorageErrorMessage();
  const favoriteModelsByType = useAppStore((a: any) => a.favoriteModelsByType as Record<string, string[]> | undefined);
  const toggleFavoriteModelForType = useAppStore((a: any) => a.toggleFavoriteModelForType as (type: string, modelId: string) => void);
  const isFavorite = !!selectedModel && (favoriteModelsByType?.video ?? []).includes(selectedModel);
  const {
    errors,
    warnings,
    addVideoError,
    addWarnings,
    clearWarnings,
    dismissError,
    dismissWarning,
  } = useVideoErrors();

  const [modalVideo, setModalVideo] = useState<VideoContent | undefined>(undefined);
  const [modalItem, setModalItem] = useState<LibraryVideoItem | undefined>(undefined);

  const openVideo = (src: VideoContent, index: number) => {
    const item = videos[index];
    setModalItem(item);
    setModalVideo(src);
  };

  const closeVideo = () => {
    setModalVideo(undefined);
    setModalItem(undefined);
  };

  const deleteStoredVideo = async (item: LibraryVideoItem) => {
    if (item.source !== "storage") return;
    if (!item.storageItemId || item.videoIndex == null) return;

    const stored = storageVideos.items.find((x) => x.id === item.storageItemId);
    if (!stored) return;

    const videosArr = stored.videoResponse.videos;
    if (!Array.isArray(videosArr)) return;

    const nextVideos = videosArr.filter((_: any, idx: number) => idx !== item.videoIndex);

    if (nextVideos.length === 0) {
      await storageVideos.delete(item.storageItemId);
    } else {
      await storageVideos.update(item.storageItemId, {
        ...stored.videoResponse,
        videos: nextVideos as any,
      });
    }
  };

  const [attachments, setAttachments] = useState<File[]>([]);
  const addAttachments = (files: File[]) => {
    const next = toSingleVideoAttachment(files);
    if (!next) return;
    setAttachments([next]);
  };
  const addAttachment = async (file: File) => addAttachments([file]);
  const removeAttachment = (name: string) => {
    setAttachments((prev) => prev.filter((file) => file.name !== name));
  };

  const { isOver, dropRef: drop, handleDrop, handleDragOver } = useChatFileDrop(
    addAttachment,
    addAttachments
  );

  const dropRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) drop(node);
    },
    [drop]
  );

  const onSend = async (content: string) => {
    clearWarnings();
    try {
      let merged = { ...(headers ?? {}), ...(customHeaders ?? {}) } as Record<string, string>;
      if (getAccessToken) {
        try {
          merged.Authorization = `Bearer ${await getAccessToken()}`;
        } catch { }
      }

      const videoProvider = createVideoProvider({
        baseUrl: config.baseUrl + (config.endpoints as any).videos,
        headers: merged,
      });

      const videoModel = videoProvider.videoModel(selectedModel, maxVideosPerCall);

      setItemsLoading((prev) => prev + n);

      const attachment = attachments.find(isValidVideoAttachment);
      const imagePayload = attachment
        ? {
          type: "file",
          mediaType: attachment.type,
          data: await fileToBase64(attachment),
        }
        : undefined;

      const inputReferences = (
        await Promise.all(
          (files.items ?? [])
            .filter((file) => file.name.startsWith(VIDEO_INPUT_REFERENCE_PREFIX))
            .map(async (file) => {
              const stored = await files.read(file.id);
              if (!stored || !isValidVideoImageAttachment(stored.data)) return undefined;
              return {
                type: "file" as const,
                mediaType: stored.data.type,
                data: await blobToBase64(stored.data),
              };
            })
        )
      ).filter((file): file is { type: "file"; mediaType: string; data: string } => !!file);

      const frameImages = (
        await Promise.all(
          videoFrameTypes.map(async (frameType) => {
            const item = (files.items ?? [])
              .filter((file) => file.name.startsWith(videoFrameImageNamePrefix(frameType)))
              .sort((a, b) => b.createdAt - a.createdAt)[0];
            if (!item) return undefined;

            const stored = await files.read(item.id);
            if (!stored || !isValidVideoImageAttachment(stored.data)) return undefined;

            return {
              frameType,
              image: {
                type: "file" as const,
                mediaType: stored.data.type,
                data: await blobToBase64(stored.data),
              },
            };
          })
        )
      ).filter(
        (frame): frame is {
          frameType: (typeof videoFrameTypes)[number];
          image: { type: "file"; mediaType: string; data: string };
        } => !!frame
      );

      const videoResult = await videoModel.doGenerate({
        prompt: content,
        n,
        seed,
        aspectRatio: aspectRatio as any,
        resolution: resolution as any,
        duration,
        fps,
        image: imagePayload,
        inputReferences: inputReferences.length ? inputReferences : undefined,
        frameImages: frameImages.length ? frameImages : undefined,
        providerOptions: providerVideoMetadata,
      } as any);

      setAttachments([]);

      const normalizedWarnings = (videoResult?.warnings ?? []).map((w: any) => ({
        message: w?.details ?? w?.message ?? String(w?.type ?? "warning"),
      }));
      addWarnings(normalizedWarnings);

      const normalizedVideos = (videoResult?.videos ?? []).map((v: any) => {
        if (v?.type === "url") {
          return {
            type: "base64" as const,
            data: v.url,
            mimeType: v.mediaType ?? "video/mp4",
          };
        }

        return {
          type: "base64" as const,
          data: v?.data ?? "",
          mimeType: v?.mimeType ?? "video/mp4",
        };
      });

      await storageVideos.add({
        ...videoResult,
        videos: normalizedVideos,
      });
      storageVideos.refresh();
    } catch (err) {
      addVideoError(getStorageErrorMessage(err, "Video generation failed"));
    } finally {
      setItemsLoading((prev) => prev - n);
    }
  };

  const downloadVideo = async (data: VideoContent) => {
    const isDataUrl = data.data.startsWith("data:");
    const mimeType = isDataUrl
      ? data.data.substring(5, data.data.indexOf(";"))
      : data.mimeType ?? "video/mp4";
    const src = isDataUrl ? data.data : `data:${mimeType};base64,${data.data}`;

    const res = await fetch(src);
    const blob = await res.blob();

    const ext =
      ({
        "video/mp4": "mp4",
        "video/webm": "webm",
        "video/quicktime": "mov",
      } as Record<string, string>)[mimeType] ?? "mp4";

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `video.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <div style={{ background: "transparent", width: "100%" }}>
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
          modelTypes={["video"]}
          value={selectedModel ?? ""}
          onChange={setSelectedModel}
        />
        <div style={{ paddingLeft: 8 }}>
          <ModelFavoriteToggleButton
            variant="subtle"
            size="small"
            isFavorite={isFavorite}
            modelName={selectedModelOption?.name ?? selectedModel}
            onToggleFavorite={() => selectedModel && toggleFavoriteModelForType("video", selectedModel)}
            disabled={!selectedModel}
          />
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ paddingLeft: 16 }}>
          <UserMenuInline />
        </div>
      </div>

      <VideoErrors errors={errors} dismissError={dismissError} />
      <VideoWarnings warnings={warnings} dismissWarning={dismissWarning} />

      <div
        style={{
          marginTop: 44,
          border: isOver ? "2px dotted" : undefined,
          borderColor: isOver ? "#888" : "transparent",
        }}
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <VideoInput
          onSend={onSend}
          attachments={attachments}
          onAddAttachments={addAttachments}
          onRemoveAttachment={removeAttachment}
        />
      </div>

      <div
        style={{
          maxWidth: "100%",
          margin: "0 auto",
          display: "flex",
          padding: "0px 12px",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <VideoGrid
          items={videos.map((item) => ({
            data: item.data,
            mimeType: item.mimeType,
            type: "base64",
            _meta: item.model ? { model: item.model } : undefined,
          }))}
          shimmers={itemsLoading}
          onVideoClick={openVideo}
          columns={isDesktop ? 3 : 1}
          gap="1rem"
          shadow
          style={{ width: "100%" }}
        />
      </div>

      {modalVideo && (
        <VideoModal
          open={modalVideo != undefined}
          video={modalVideo}
          onDownload={() => downloadVideo(modalVideo!)}
          onDelete={
            modalItem?.source === "storage"
              ? () => {
                void (async () => {
                  try {
                    await deleteStoredVideo(modalItem);
                    closeVideo();
                  } catch (err) {
                    addVideoError(getStorageErrorMessage(err, "Delete failed"));
                  }
                })();
              }
              : undefined
          }
          onClose={closeVideo}
        />
      )}
    </div>
  );
};
