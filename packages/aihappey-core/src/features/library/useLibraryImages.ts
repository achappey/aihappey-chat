import { useMemo } from "react";
import { useConversations } from "aihappey-conversations";

export type LibraryImageItem = {
    conversationId: string;
    messageId: string;
    createdAt: number;
    data: string;
    mimeType: string;
};

export function useLibraryImages(): LibraryImageItem[] {
    const conversations = useConversations();

    return useMemo(() => {
        const out: LibraryImageItem[] = [];

        conversations.items.forEach((c: any) =>
            c.messages
                .filter((m: any) => m.role === "assistant")
                .forEach((m: any) => {
                    const createdAt = m.metadata?.timestamp ?? 0;

                    // tool image outputs
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

        return out.sort((a, b) => b.createdAt - a.createdAt);
    }, [conversations.items]);
}
