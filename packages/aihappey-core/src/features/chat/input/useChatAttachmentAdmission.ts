import { useCallback } from "react";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { fileAttachmentRuntime } from "../../../runtime/files/fileAttachmentRuntime";

const DEFAULT_MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;

const formatAttachmentLimit = (bytes: number) => {
  const megabytes = bytes / (1024 * 1024);
  return `${Number.isInteger(megabytes) ? megabytes : megabytes.toFixed(1)} MB`;
};

/**
 * Admits chat attachments at the point where users select them.
 * Valid files are retained while oversized files are rejected as one batch.
 */
export function useChatAttachmentAdmission() {
  const { t } = useTranslation();
  const maxAttachmentsSize = useAppStore((s) => s.maxAttachmentsSize);
  const addChatError = useAppStore((s) => s.addChatError);
  const maxSize = typeof maxAttachmentsSize === "number"
    ? maxAttachmentsSize
    : DEFAULT_MAX_ATTACHMENT_SIZE;

  return useCallback((files: FileList | File[]) => {
    const rejected: File[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        rejected.push(file);
      } else {
        fileAttachmentRuntime.add(file);
      }
    });

    if (rejected.length > 0) {
      addChatError(new Error(t("attachmentSizeExceeded", {
        filenames: rejected.map((file) => file.name).join(", "),
        limit: formatAttachmentLimit(maxSize),
      })));
    }
  }, [addChatError, maxSize, t]);
}
