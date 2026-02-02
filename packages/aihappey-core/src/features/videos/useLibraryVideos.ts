import { useConversations } from "aihappey-conversations";
import type { VideoItem } from "aihappey-videos";
import { useVideos } from "aihappey-videos";
import { useMemo } from "react";

export type LibraryVideoItem = {
  source: "storage" | "conversation";
  messageId: string;
  createdAt: string;
  data: string;
  mimeType: string;
  storageItemId?: string;
  videoIndex?: number;
  model?: string;
};

const normalizeVideoData = (input: string) => {
  const dataUrlMatch = /^data:([^;]+);base64,(.*)$/i.exec(input);
  if (dataUrlMatch) {
    return { mimeType: dataUrlMatch[1], data: dataUrlMatch[2] };
  }

  return { mimeType: "video/mp4", data: input };
};

export function useLibraryVideos(): LibraryVideoItem[] {
  const conversations = useConversations();
  const videos = useVideos();

  return useMemo(() => {
    const out: LibraryVideoItem[] = [];

    videos.items.forEach((c: VideoItem) => {
      (c.videoResponse?.videos ?? []).forEach((d: { data?: string; mimeType?: string }, videoIndex: number) => {
        const raw = d?.data ?? "";
        const { mimeType, data } = normalizeVideoData(raw);

        out.push({
          source: "storage",
          messageId: c.id,
          createdAt: c.videoResponse?.response?.timestamp?.toString?.() ?? new Date().toString(),
          data,
          mimeType: d?.mimeType ?? mimeType,
          storageItemId: c.id,
          videoIndex,
          model: c.videoResponse?.response?.modelId,
        });
      });
    });

    // Conversation parsing for videos can be added when chat responses include video parts.

    return out;
  }, [conversations.items, videos.items]);
}
