import { useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";
import { useCallback } from "react";

// You can type this as you want (e.g., (file: File) => void)
export function useChatFileDrop(addAttachment: (file: File) => void) {
  // File drop fallback for HTML5 (required!)
  const handleFileDrop = useCallback((files: FileList | File[]) => {
    files = Array.from(files);
    files.forEach((file) => addAttachment(file));
  }, [addAttachment]);

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
