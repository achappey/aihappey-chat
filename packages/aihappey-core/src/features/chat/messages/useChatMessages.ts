import { useTranslation } from "aihappey-i18n";
import { MessageRole } from "aihappey-types";
import { useMemo } from "react";
import { format } from "timeago.js";

export interface ChatMessageData {
  contentText: string;
  role: MessageRole;
  id: string;
  author?: string;
  totalTokens?: number;
  temperature?: number;
  createdAt: string;
  sources: { title: string; url: string }[];
  tools: any[];
  isImage: boolean;
  isVideo?: boolean;
}

export const useChatMessages = (messages: any[]) => {
  const { t } = useTranslation();

  return useMemo<ChatMessageData[]>(() => {
    return messages
      .filter((a) => a.role !== "system")
      .flatMap((r: any) => {
        const sources =
          r.parts
            ?.filter(
              (p: any) =>
                p.type === "source-url" || p.type === "source-document"
            )
            .map((p: any) => ({ title: p.title, url: p.url })) ?? [];

        const attachments =
          r.parts?.filter((p: any) => p.type === "file") ?? [];

        return r.parts.flatMap((z: any, idx: number) => {
          const tools =
            r.parts?.filter((p: any) => p.type.startsWith("tool-")) ?? [];

          // 🧩 Widget & tool results (unchanged)
          if (z.type?.startsWith("tool-") && z.output?._meta?.["chat/html"]) {
            const html = z.output._meta["chat/html"];
            return [
              {
                id: `${r.id}-widget-${idx}`,
                role: r.role,
                contentText: html,
                createdAt: format(r.metadata?.timestamp),
                author: r.metadata?.author ?? r.metadata?.model,
                sources,
                tools: [z],
              },
            ];
          }

          // 🧠 Handle reasoning once per message
          if (idx === 0) {
            const reasonings = r.parts.filter(
              (p: any) => p.type === "reasoning"
            );
            if (reasonings.length > 0) {
              return [
                {
                  id: r.id + "-reasoning-group",
                  role: r.role,
                  author: r.metadata?.author ?? r.metadata?.model,
                  createdAt: format(r.metadata?.timestamp),
                  messageLabel: t("reasoning"),
                  messageIcon: "brain",
                  reasoningItems: reasonings.map((p: any) => p.text),
                  totalTokens: r.metadata?.totalTokens,
                  temperature: r.metadata?.temperature,
                  sources,
                  tools,
                  isReasoningGroup: true,
                },
              ];
            }
          }

          // 🧾 Handle normal text / image messages
          if (
            z.type === "text" ||
            (z.type === "file" && z.mediaType?.startsWith("image/"))
          ) {
            let contentText: string;
            let isImage = false;

            if (z.type === "file" && z.mediaType?.startsWith("image/")) {
              const alt = z.filename || "image";
              const url: string = z.url;
              contentText = `![${alt}](${url})`;
              isImage = true;
            } else {
              contentText = z.text;
            }

            return [
              {
                contentText,
                role: r.role,
                id: r.id + "-" + idx,
                author: r.metadata?.author ?? r.metadata?.model,
                totalTokens: r.metadata?.totalTokens,
                temperature: r.metadata?.temperature,
                createdAt: format(r.metadata?.timestamp),
                sources,
                attachments,
                tools,
                isImage,
              },
            ];
          }

          // 🧩 Handle tool outputs with resource links (images + videos)
          // 🧩 Handle tool outputs with resource links (images + videos + 3D)
          if (z.type?.startsWith("tool-") && Array.isArray(z.output?.content)) {
            return z.output.content
              .flatMap((item: any) => {
                // Support both resource_link and resource
                const mime =
                  item.mimeType ||
                  item.resource?.mimeType;
                const uri =
                  item.uri ||
                  (item.resource?.blob
                    ? `data:${mime};base64,${item.resource.blob}`
                    : undefined);

                if (
                  !mime ||
                  !uri ||
                  !(
                    mime.startsWith("image/") ||
                    mime.startsWith("video/") ||
                    mime.startsWith("model/")
                  )
                ) {
                  return [];
                }

                const alt =
                  z.toolCallId ||
                  (mime.startsWith("video/")
                    ? "tool-video"
                    : mime.startsWith("model/")
                      ? "tool-model"
                      : "tool-image");

                let contentText = "";
                if (mime.startsWith("image/")) {
                  contentText = `![${alt}](${uri})`;
                } else if (mime.startsWith("video/")) {
                  contentText = `<video autoplay muted playsinline controls style="max-width:100%;"><source src="${uri}" type="${mime}" />Your browser does not support HTML5 video.</video>`;
                } else if (mime.startsWith("model/")) {
                  contentText = `<model-viewer src="${uri}" camera-controls auto-rotate shadow-intensity="0.8" style="max-width:100%;height:400px"></model-viewer>`;
                }

                return {
                  contentText,
                  role: r.role,
                  id: `${r.id}-toolmedia-${idx}-${item.id || Math.random()}`,
                  author: r.metadata?.author ?? r.metadata?.model,
                  createdAt: format(r.metadata?.timestamp),
                  sources,
                  tools: tools?.filter((a: any) => a.toolCallId == z.toolCallId),
                  isImage: mime.startsWith("image/"),
                  isVideo: mime.startsWith("video/"),
                  isModel: mime.startsWith("model/"),
                };
              });
          }



          return [];
        });
      });
  }, [messages]);
};
