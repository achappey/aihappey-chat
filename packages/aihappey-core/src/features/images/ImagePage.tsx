import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import { ImageGrid } from "aihappey-components";
import { useLibraryImages } from "./useLibraryImages";
import { ImageInput } from "./ImageInput";
import { ModelSelect } from "../models/ModelSelect";
import { useAppStore } from "aihappey-state";
import { useState } from "react";
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
import { fileToBase64 } from "../chat/files/file";
import { UserMenuInline } from "../user-settings/UserMenuInline";

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

  const getAccessToken = config?.getAccessToken;
  const [selectedModel, setSelectedModel] = useState<string>(
    userPreferredImageModel ??
    (getAccessToken ?
      "openai/chatgpt-image-latest" : "pollinations/flux"));
  const headers = config?.headers;
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

  const openImage = (src: ImageContent) => {
    setModalImage(src);
  };

  const closeImage = () => {
    setModalImage(undefined);
  };
  const attachments = useFileAttachments(fileAttachmentRuntime);
  const addAttachment = async (file: File) => {

    // Fallback: just add as normal file attachment
    fileAttachmentRuntime.add(file);
  };

  const { isOver, dropRef, handleDrop, handleDragOver } = useChatFileDrop(
    addAttachment
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
        baseUrl: config.api?.replace("/api/chat", "") ?? "",
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
        mask: undefined,
        files: files,
        providerOptions: providerImageMetadata
      })
      addWarnings(imageResult.warnings);
      await storageImages.add(imageResult)
      storageImages.refresh()
    } catch (err: any) {
      addChatError(err?.message ?? "Image generation failed");
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
