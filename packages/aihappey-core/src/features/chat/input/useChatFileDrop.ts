import { useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";
import { useCallback } from "react";

// You can type this as you want (e.g., (file: File) => void)
// Optional `addAttachments` enables batching the drop event into a single callback.
export function useChatFileDrop(
  addAttachment: (file: File) => void,
  addAttachments?: (files: File[]) => void
) {
  // File drop fallback for HTML5 (required!)
  const handleFileDrop = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);

    // Prefer batching so callers can aggregate UI (e.g., a single warning/toast).
    if (addAttachments) {
      addAttachments(fileArray);
      return;
    }

    fileArray.forEach((file) => addAttachment(file));
  }, [addAttachment, addAttachments]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer?.files) {
      handleFileDrop(e.dataTransfer.files);
    }
  }, [handleFileDrop]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  // DnD preview
  const [{ isOver }, dropRef] = useDrop({
    accept: [NativeTypes.FILE],
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return { isOver, dropRef, handleDrop, handleDragOver };
}
