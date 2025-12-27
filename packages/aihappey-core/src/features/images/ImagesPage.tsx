import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import { ImageGrid } from "aihappey-components";
import { useLibraryImages } from "./useLibraryImages";
import { ImageInput } from "./ImageInput";
import { ModelSelect } from "../models/ModelSelect";
import { useAppStore } from "aihappey-state";
import { useState } from "react";
import { createImageProvider } from "../../runtime/providers/imageProvider";
import { useChatContext } from "../chat/context/ChatContext";
import { useTranslation } from "aihappey-i18n";
import { useImages } from "aihappey-images";
import { useImageErrors } from "./useImageErrors";
import { ImageErrors } from "./ImageErrors";
import { useChatFileDrop } from "../chat/input/useChatFileDrop";
import { fileAttachmentRuntime, useFileAttachments } from "../../runtime/files/fileAttachmentRuntime";

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // strip data:...;base64,
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });


export const ImagesPage = () => {
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
  const { t } = useTranslation()
  const storageImages = useImages()
  const getAccessToken = config?.getAccessToken;
  const [selectedModel, setSelectedModel] = useState<string>(getAccessToken ?
    "openai/chatgpt-image-latest" : "pollinations/flux");
  const headers = config?.headers;
  const { errors, addChatError, dismissError } = useImageErrors();

  const attachments = useFileAttachments(fileAttachmentRuntime);
  const addAttachment = async (file: File) => {

    // Fallback: just add as normal file attachment
    fileAttachmentRuntime.add(file);
  };

  const { isOver, dropRef, handleDrop, handleDragOver } = useChatFileDrop(
    addAttachment
  );

  const onSend = async (content: string) => {

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

      await storageImages.add(imageResult)
      storageImages.refresh()
    } catch (err: any) {
      addChatError(err?.message ?? "Image generation failed");
    } finally {
      setItemsLoading((prev) => prev - n);
    }
  }

  //imageModel
  return (
    <div
      style={{
        background: "transparent",
        width: "100%",
      }}
    >
      <ModelSelect
        models={models ?? []}
        modelType="image"
        value={selectedModel ?? ""}
        onChange={setSelectedModel}
      />

      <ImageErrors
        errors={errors}
        dismissError={dismissError}
      />

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
          columns={isDesktop ? 5 : 2}
          gap="1rem"
          fit="cover"
          shape="square"
          shadow
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
};
