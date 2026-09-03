import { useMemo } from "react";
import { useImages } from "aihappey-images";

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
    cost?: number;
};

const getGatewayCost = (providerMetadata?: Record<string, any>) => {
    const cost = providerMetadata?.gateway?.cost;
    return typeof cost === "number" && Number.isFinite(cost) ? cost : undefined;
};

const getGatewayImageCost = (providerMetadata: Record<string, any> | undefined, imageIndex: number) => {
    const cost = providerMetadata?.gateway?.images?.[imageIndex]?.cost;
    return typeof cost === "number" && Number.isFinite(cost) ? cost : undefined;
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
    const images = useImages();

    return useMemo(() => {
        const out: LibraryImageItem[] = [];

        images.items.forEach((c) => {
            const totalCost = getGatewayCost(c.imageResponse.providerMetadata as Record<string, any> | undefined);
            const imageCount = c.imageResponse.images.length;

            c.imageResponse.images.forEach((d, imageIndex) => {
                const cost = getGatewayImageCost(c.imageResponse.providerMetadata as Record<string, any> | undefined, imageIndex)
                    ?? (totalCost !== undefined && imageCount > 0 ? totalCost / imageCount : undefined);
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
                    model: c.imageResponse.response.modelId,
                    cost,
                })
            });
        });

        return out.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

    }, [images.items]);
}
