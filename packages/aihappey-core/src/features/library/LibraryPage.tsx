import { useMemo } from "react";
import { useConversations } from "aihappey-conversations";
import { ImageGrid } from "../../ui/media/ImageGrid";
import { LibraryHeader } from "./LibraryHeader";
import { useMediaQuery } from "usehooks-ts";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";

type ImageItem = {
  conversationId: string;
  messageId: string;
  createdAt: number;
  data: string;
  mimeType: string;
};

export const LibraryPage = () => {
  const conversations = useConversations();
  const isDesktop = useIsDesktop();
  const images = useMemo(() => {
    const out: ImageItem[] = [];
    conversations.items.forEach((c: any) =>
      c.messages
        .filter((m: any) => m.role === "assistant")
        .forEach((m: any) =>
          (m.parts || [])
            .filter(
              (p: any) =>
                typeof p?.type === "string" &&
                p.type.startsWith("tool-") &&
                p.state === "output-available"
            )
            .forEach((p: any) =>
              (p.output?.content || [])
                .filter((x: any) => x.type === "image")
                .forEach((img: any) =>
                  out.push({
                    conversationId: c.id,
                    messageId: m.id,
                    createdAt: m.metadata?.timestamp ?? 0,
                    data: img.data,
                    mimeType: img.mimeType,
                  })
                )
            )
        )
    );

    conversations.items.forEach((c: any) =>
      c.messages
        .filter((m: any) => m.role === "assistant")
        .forEach((m: any) =>
          (m.parts || [])
            .filter(
              (p: any) =>
                typeof p?.type === "string" &&
                p.type === "file" &&
                p.mediaType.startsWith("image/")
            )
            .forEach((p: any) =>
            (
              out.push({
                conversationId: c.id,
                messageId: m.id,
                createdAt: m.metadata?.timestamp ?? 0,
                data: p.url,
                mimeType: p.mimeType,
              })
            )
            )
        )
    );

    return out.sort((a, b) => b.createdAt - a.createdAt);
  }, [conversations.items]);


  return (
    <div
      style={{
        //     minHeight: "100vh",
        background: "transparent",
        width: "100%",
      }}
    >
      <LibraryHeader />
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
        columns={isDesktop ? 5 : 2}
        gap="1rem"
        fit="cover"
        shape="square"
        shadow
        style={{ width: "100%" }}
      />
    </div>
    </div >
  );
};
