import { useMemo } from "react";
import { useConversations } from "aihappey-conversations";
import { useImages } from "aihappey-images";
import { toArray } from "../chat/activity/drawer/ActivityDrawer";

export type LibraryImageItem = {
    source: "storage" | "conversation";
    conversationId: string;
    messageId: string;
    createdAt: string;
    data: string;
    mimeType: string;
    /** Present only when source === "storage" */
    storageItemId?: string;
    /** Present only when source === "storage" */
    imageIndex?: number;
    model?: string;
};

const parseImageData = (input: string) => {
    // data:<mime>;base64,<payload>
    const m = /^data:([^;]+);base64,(.*)$/i.exec(input);
    if (m) {
        return { mimeType: m[1], data: m[2] }; // ✅ base64 only (no prefix)
    }

    // fallback: assume already base64 payload
    return { mimeType: "", data: input };
};

export function useLibraryImages(): LibraryImageItem[] {
    const conversations = useConversations();
    const images = useImages();

    return useMemo(() => {
        const out: LibraryImageItem[] = [];

        images.items.forEach((c) => {
            c.imageResponse.images.forEach((d, imageIndex) => {
                const raw = d.toString();
                const { mimeType, data } = parseImageData(raw);

                out.push({
                    source: "storage",
                    // Stored image generations are not tied to a conversation message.
                    // Keep the fields for UI parity, but do not imply they belong to a conversation.
                    conversationId: "storage",
                    messageId: c.id,
                    createdAt: c.imageResponse.response.timestamp.toString(),
                    data,
                    mimeType,
                    storageItemId: c.id,
                    imageIndex,
                    model: c.imageResponse.response.modelId
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
                            toArray(p.output?.content) // 👈 SAFE
                                .filter((x: any) => x.type === "image")
                                .forEach((img: any) =>
                                    out.push({
                                        source: "conversation",
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
                                source: "conversation",
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
