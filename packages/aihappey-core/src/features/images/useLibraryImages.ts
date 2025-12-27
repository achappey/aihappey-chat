import { useMemo } from "react";
import { useConversations } from "aihappey-conversations";
import { useImages } from "aihappey-images";

export type LibraryImageItem = {
    conversationId: string;
    messageId: string;
    createdAt: string;
    data: string;
    mimeType: string;
};

export function useLibraryImages(): LibraryImageItem[] {
    const conversations = useConversations();
    const images = useImages();
    return useMemo(() => {
        const out: LibraryImageItem[] = [];

        images.items.forEach((c) => {
            c.imageResponse.images.forEach((d) => {
                out.push({
                    conversationId: c.id,
                    messageId: c.id,
                    createdAt: c.imageResponse.response.timestamp.toString(),
                    data: d.toString(),
                    mimeType: d.toString().match(/^data:(.*?);/)?.[1]!,
                })
            });
        });

        conversations.items.forEach((c) =>
            c.messages
                .filter((m) => m.role === "assistant")
                .forEach((m) => {
                    const createdAt = m.metadata?.timestamp;

                    // tool image outputs
                    (m.parts || [])
                        .filter(
                            (p) =>
                                typeof p?.type === "string" &&
                                p.type.startsWith("tool-") &&
                                p.state === "output-available"
                        )
                        .forEach((p) =>
                            (p.output?.content || [])
                                .filter((x: any) => x.type === "image")
                                .forEach((img: any) =>
                                    out.push({
                                        conversationId: c.id,
                                        messageId: m.id,
                                        createdAt,
                                        data: img.data,
                                        mimeType: img.mimeType,
                                    })
                                )
                        );

                    // file image parts
                    (m.parts || [])
                        .filter(
                            (p: any) =>
                                p.type === "file" &&
                                typeof p.mediaType === "string" &&
                                p.mediaType.startsWith("image/")
                        )
                        .forEach((p: any) =>
                            out.push({
                                conversationId: c.id,
                                messageId: m.id,
                                createdAt,
                                data: p.url,
                                mimeType: p.mimeType,
                            })
                        );
                })
        );

        return out.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

    }, [conversations.items, images.items]);
}
