import { useCallback, useState } from "react";
import type { FileUIPart } from "aihappey-ai";
import { useFiles } from "aihappey-files";
import { useTranslation } from "aihappey-i18n";

export type AttachmentToast = {
  id: string;
  variant: "info" | "success" | "error";
  message: any;
  show: boolean;
  autohide?: number;
};

export function useAttachmentsToaster() {
  const files = useFiles();
  const { t } = useTranslation();

  const [toast, setToast] = useState<AttachmentToast>({
    id: "add-to-files",
    variant: "success",
    message: "",
    show: false,
    autohide: 2500,
  });

  const blobFromDataUrl = useCallback((dataUrl: string) => {
    const [prefix, data] = dataUrl.split(",", 2);
    if (!data) throw new Error("Invalid data URL");

    const mimeMatch = prefix.match(/data:([^;]+);base64/i);
    const inferredMime = mimeMatch?.[1];

    const byteChars = atob(data);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }

    return new Blob([new Uint8Array(byteNumbers)], {
      type: inferredMime || "application/octet-stream",
    });
  }, []);

  const makeUniqueName = useCallback(
    (name: string) => {
      const existing = new Set((files.items ?? []).map((f) => f.name));
      if (!existing.has(name)) return name;

      const dot = name.lastIndexOf(".");
      const base = dot > 0 ? name.slice(0, dot) : name;
      const ext = dot > 0 ? name.slice(dot) : "";

      let i = 2;
      while (existing.has(`${base} (${i})${ext}`)) i++;
      return `${base} (${i})${ext}`;
    },
    [files.items]
  );

  const addAttachmentToFiles = useCallback(
    async (part: FileUIPart) => {
      try {
        const { url, mediaType, providerMetadata } = part;
        if (!url) return;

        const suggestedName =
          providerMetadata?.openai?.filename?.toString() ||
          `attachment-${Date.now()}`;

        let blob: Blob;

        if (url.startsWith("data:")) {
          blob = blobFromDataUrl(url);
        } else if (url.startsWith("http")) {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to fetch attachment: ${res.status}`);
          blob = await res.blob();
        } else {
          // raw base64 fallback
          const byteChars = atob(url);
          const byteNumbers = new Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) {
            byteNumbers[i] = byteChars.charCodeAt(i);
          }
          blob = new Blob([new Uint8Array(byteNumbers)], {
            type: mediaType || "application/octet-stream",
          });
        }

        const finalMime = mediaType || blob.type || "application/octet-stream";
        const finalName = makeUniqueName(suggestedName);

        await files.create({
          name: finalName,
          mimeType: finalMime,
          data: blob,
        });

        files.refresh();

        setToast({
          id: `add-to-files-${Date.now()}`,
          variant: "success",
          message: t("fileAdded", { filename: finalName }),
          show: true,
          autohide: 2500,
        });
      } catch (e) {
        console.error("Add-to-files failed", e);

        setToast({
          id: `add-to-files-${Date.now()}`,
          variant: "error",
          message: "Failed to add file",
          show: true,
          autohide: 3500,
        });
      }
    },
    [blobFromDataUrl, files, makeUniqueName, t]
  );

  const closeToast = useCallback(() => {
    setToast((t) => ({ ...t, show: false }));
  }, []);

  return {
    toast,
    closeToast,
    addAttachmentToFiles,
  };
}
