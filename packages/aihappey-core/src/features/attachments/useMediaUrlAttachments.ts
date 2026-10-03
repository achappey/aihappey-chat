import { useState } from "react";
import { createUrlAttachment, type UrlAttachment } from "./urlAttachment";

/** Each media page owns its links; they never enter chat's file-part runtime. */
export const useMediaUrlAttachments = () => {
  const [urlAttachments, setUrlAttachments] = useState<UrlAttachment[]>([]);
  const addUrlAttachment = (part: UrlAttachment) => {
    const next = createUrlAttachment(part.url);
    setUrlAttachments(current => current.some(item => item.url === next.url)
      ? current : [...current, next]);
  };
  const removeUrlAttachment = (url: string) => {
    setUrlAttachments(current => current.filter(item => item.url !== url));
  };
  const clearUrlAttachments = () => setUrlAttachments([]);

  return { urlAttachments, addUrlAttachment, removeUrlAttachment, clearUrlAttachments };
};
