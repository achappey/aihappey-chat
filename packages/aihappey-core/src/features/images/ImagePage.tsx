import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import { ImageGrid, useTheme } from "aihappey-components";
import { LibraryImageItem, useLibraryImages } from "./useLibraryImages";
import { ImageInput } from "./ImageInput";
import { ModelSelect } from "../models/ModelSelect";
import { useAppStore } from "aihappey-state";
import { useCallback, useMemo, useState } from "react";
import { useChatContext } from "../chat/context/ChatContext";
import { useImages } from "aihappey-images";
import { useImageErrors } from "./useImageErrors";
import { ImageErrors } from "./ImageErrors";
import { useChatFileDrop } from "../chat/input/useChatFileDrop";
import { fileAttachmentRuntime, useFileAttachments } from "../../runtime/files/fileAttachmentRuntime";
import { ImageModal } from "./ImageModal";
import { ImageWarnings } from "./ImageWarnings";
import { ImageContent } from "@modelcontextprotocol/sdk/types";
import { createImageProvider } from "aihappey-ai";
import { blobToBase64, fileToBase64 } from "../chat/files/file";
import { UserMenuInline } from "../user-settings/UserMenuInline";
import { useFiles } from "aihappey-files";
import { useStorageErrorMessage } from "../storage/storageErrorMessage";
import { useTranslation } from "aihappey-i18n";

export const ImagePage = () => {
  const images = useLibraryImages();
  const isDesktop = useIsDesktop();
  const models = useAppStore((a) => a.models);
  const customHeaders = useAppStore((a) => a.customHeaders);
  const seed = useAppStore((a) => a.seed);
  const n = useAppStore((a) => a.n);
  const maxImagesPerCall = useAppStore((a) => a.maxImagesPerCall);
  const size = useAppStore((a) => a.size);
  const aspectRatio = useAppStore((a) => a.aspectRatio);
  const providerImageMetadata = useAppStore((a) => a.providerImageMetadata);
  const { config } = useChatContext();
  const [itemsLoading, setItemsLoading] = useState<number>(0);
  const storageImages = useImages()
  const userPreferredImageModel = useAppStore((a) => a.userPreferredImageModel);
  const files = useFiles()
  const { t } = useTranslation();
  const getAccessToken = config?.getAccessToken;
  const [selectedModel, setSelectedModel] = useState<string>(
    userPreferredImageModel ??
    (getAccessToken ?
      "openai/chatgpt-image-latest" : "pollinations/flux"));
  const headers = config?.headers;
  const getStorageErrorMessage = useStorageErrorMessage();
  const { Button } = useTheme();
  const favoriteModelsByType = useAppStore((a: any) => a.favoriteModelsByType as Record<string, string[]> | undefined);
  const toggleFavoriteModelForType = useAppStore((a: any) => a.toggleFavoriteModelForType as (type: string, modelId: string) => void);
  const isFavorite = !!selectedModel && (favoriteModelsByType?.image ?? []).includes(selectedModel);
  const {
    errors,
    warnings,
    addChatError,
    addWarnings,
    clearWarnings,
    dismissError,
    dismissWarning,
  } = useImageErrors();

  const [modalImage, setModalImage] = useState<ImageContent | undefined>(undefined);
  const [modalItem, setModalItem] = useState<LibraryImageItem | undefined>(undefined);

  const openImage = (src: ImageContent, index: number) => {
    const item = images[index];
    setModalItem(item);
    setModalImage(src);
  };

  const closeImage = () => {
    setModalImage(undefined);
    setModalItem(undefined);
  };

  const deleteStoredImage = async (item: LibraryImageItem) => {
    // Defensive: never delete images coming from conversations
    if (item.source !== "storage") return;
    if (!item.storageItemId || item.imageIndex == null) return;

    const stored = storageImages.items.find((x) => x.id === item.storageItemId);
    if (!stored) return;

    const imagesArr = stored.imageResponse.images;
    if (!Array.isArray(imagesArr)) return;

    const nextImages = imagesArr.filter((_, idx) => idx !== item.imageIndex);

    if (nextImages.length === 0) {
      await storageImages.delete(item.storageItemId);
    } else {
      await storageImages.update(item.storageItemId, {
        ...stored.imageResponse,
        images: nextImages as any,
      });
    }
  };

  const attachments = useFileAttachments(fileAttachmentRuntime);
  const addAttachment = async (file: File) => {

    // Fallback: just add as normal file attachment
    fileAttachmentRuntime.add(file);
  };

  const { isOver, dropRef: drop, handleDrop, handleDragOver } = useChatFileDrop(
    addAttachment
  );

  const dropRef = useCallback((node: HTMLDivElement | null) => {
    if (node) drop(node);
  }, [drop]);

  const maskEntry = useMemo(
    () => (files.items ?? []).find((f) => f.name === "image_mask"),
    [files.items]
  );

  const onSend = async (content: string) => {
    clearWarnings();
    try {
      let merged = { ...(headers ?? {}), ...(customHeaders ?? {}) };
      if (getAccessToken) {
        try {
          merged.Authorization = `Bearer ${await getAccessToken()}`;
        } catch { }
      }

      const imageProvider = createImageProvider({
        baseUrl: config.baseUrl + config.endpoints.images,
        headers: merged
      })

      const imageModel = imageProvider.imageModel(selectedModel, maxImagesPerCall);

      setItemsLoading((prev) =>
        prev + n
      )

      const files: any[] = await Promise.all(
        attachments.map(async (z) => ({
          type: "file",
          mediaType: z.type,
          data: await fileToBase64(z),
        }))
      );

      const imageResult = await imageModel.doGenerate({
        prompt: content,
        n: n,
        size: size as any,
        aspectRatio: aspectRatio as any,
        seed: seed,
        mask: maskEntry ? {
          type: "file",
          mediaType: maskEntry.data.type,
          data: await blobToBase64(maskEntry.data)
        } : undefined,
        files: files,
        providerOptions: providerImageMetadata
      })
      addWarnings(imageResult.warnings);
      await storageImages.add(imageResult)
      storageImages.refresh()
    } catch (err) {
      addChatError(getStorageErrorMessage(err, "Image generation failed"));
    } finally {
      setItemsLoading((prev) => prev - n);
    }
  }

  const downloadImage = async (data: ImageContent) => {
    // data can be:
    // - full data URL: data:image/png;base64,...
    // - raw base64 (assumed image/png)

    const isDataUrl = data.data.startsWith("data:");

    const mimeType = isDataUrl
      ? data.data.substring(5, data.data.indexOf(";"))
      : "image/png";

    const src = isDataUrl
      ? data.data
      : `data:${mimeType};base64,${data.data}`;

    const res = await fetch(src);
    const blob = await res.blob();

    const ext =
      ({
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/svg+xml": "svg",
        "image/bmp": "bmp",
        "image/avif": "avif",
      } as Record<string, string>)[mimeType] ?? "bin";

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `image.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const extFromMime = (mimeType: string) =>
    ({
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/svg+xml": "svg",
      "image/bmp": "bmp",
      "image/avif": "avif",
    } as Record<string, string>)[mimeType] ?? "bin";

  const addImageToPrompt = (data: ImageContent) => {
    void (async () => {
      // data = data URL OR raw base64
      const isDataUrl = data.data.startsWith("data:");
      const mimeType = isDataUrl
        ? data.data.substring(5, data.data.indexOf(";"))
        : "image/png";

      const src = isDataUrl ? data.data : `data:${mimeType};base64,${data.data}`;

      // safest conversion: dataURL -> blob via fetch
      const blob = await (await fetch(src)).blob();

      const ext = extFromMime(mimeType);
      const file = new File([blob], `image_${Date.now()}.${ext}`, {
        type: mimeType,
      });

      fileAttachmentRuntime.add(file);
    })();
  };


  //imageModel
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
          modelTypes={["image"]}
          value={selectedModel ?? ""}
          onChange={setSelectedModel}
        />
        <div style={{ paddingLeft: 8 }}>
          <Button
            variant="subtle"
            size="small"
            icon={isFavorite ? "starFilled" : "star"}
            onClick={() => selectedModel && toggleFavoriteModelForType("image", selectedModel)}
            disabled={!selectedModel}
            title={isFavorite ? t("unfavorite_model") : t("favorite_model")}
          />
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ paddingLeft: 16 }}>
          <UserMenuInline />
        </div>
      </div>

      <ImageErrors
        errors={errors}
        dismissError={dismissError}
      />

      <ImageWarnings warnings={warnings} dismissWarning={dismissWarning} />

      <div style={{
        marginTop: 44,
        border: isOver ? "2px dotted" : undefined,
        borderColor: isOver ? "#888" : "transparent",
      }}
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}>

        <ImageInput onSend={onSend} />

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
        <ImageGrid
          items={images.map((item) => ({
            data: item.data,
            mimeType: item.mimeType,
            type: "image",
            _meta: item.model ? {
              model: item.model
            } : undefined
          }))}
          shimmers={itemsLoading}
          onImageClick={openImage}
          onImageDownload={downloadImage}
          columns={isDesktop ? 5 : 2}
          gap="1rem"
          fit="cover"
          shape="square"
          shadow
          style={{ width: "100%" }}
        />
      </div>
      {modalImage && (
        <ImageModal
          open={modalImage != undefined}
          image={modalImage}
          onDownload={() =>
            downloadImage(modalImage!)
          }
          onDelete={
            modalItem?.source === "storage"
              ? () => {
                void (async () => {
                  try {
                    await deleteStoredImage(modalItem);
                    closeImage();
                  } catch (err) {
                    addChatError(getStorageErrorMessage(err, "Delete failed"));
                  }
                })();
              }
              : undefined
          }
          onAddToPrompt={() => {
            addImageToPrompt(modalImage!);
            closeImage();
          }}
          onClose={closeImage}
        />
      )}

    </div>
  );
};
