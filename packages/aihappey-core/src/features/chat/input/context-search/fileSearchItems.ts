import type { FileUIPart, UIMessage } from "aihappey-ai";
import type { StoredFile } from "aihappey-files";
import { normalizeCatalogText } from "../../../tools/toolCatalogItems";

export type ContextFileSearchItem = {
    id: string;
    name: string;
    source: "local" | "runtime" | "conversation";
    sourceLabel: string;
    mimeType?: string;
    size?: number;
    createdAt?: number;
    conversationTitle?: string;
    toFile: () => Promise<File | undefined>;
};

function dataUrlToBlob(dataUrl: string, mediaType?: string) {
    const [prefix, data] = dataUrl.split(",", 2);
    if (!data) throw new Error("Invalid data URL");
    const mimeMatch = prefix.match(/data:([^;]+);base64/i);
    const mime = mediaType || mimeMatch?.[1] || "application/octet-stream";
    const byteChars = atob(data);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
    return new Blob([new Uint8Array(byteNumbers)], { type: mime });
}

async function filePartToFile(part: FileUIPart, fallbackName: string) {
    const url = part.url ?? "";
    const mediaType = part.mediaType || "application/octet-stream";
    const name =
        (part.providerMetadata as any)?.openai?.filename?.toString()
        || (part as any).filename
        || fallbackName;

    if (url.startsWith("data:")) {
        return new File([dataUrlToBlob(url, mediaType)], name, { type: mediaType });
    }

    if (url.startsWith("http")) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch attachment: ${res.status}`);
        const blob = await res.blob();
        return new File([blob], name, { type: mediaType || blob.type });
    }

    if (url) {
        const byteChars = atob(url);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
        return new File([new Uint8Array(byteNumbers)], name, { type: mediaType });
    }

    return undefined;
}

export function buildContextFileSearchItems(args: {
    storedFiles: StoredFile[];
    runtimeFiles: File[];
    conversations: any[];
    labels: {
        local: string;
        runtime: string;
        conversation: string;
    };
}): ContextFileSearchItem[] {
    const localItems: ContextFileSearchItem[] = (args.storedFiles ?? []).map((f) => ({
        id: `local:${f.id}`,
        name: f.name,
        source: "local",
        sourceLabel: args.labels.local,
        mimeType: f.data?.type,
        size: f.data?.size,
        createdAt: f.createdAt,
        toFile: async () => new File([f.data], f.name, { type: f.data?.type || "application/octet-stream" }),
    }));

    const runtimeItems: ContextFileSearchItem[] = (args.runtimeFiles ?? []).map((f, index) => ({
        id: `runtime:${f.name}:${index}`,
        name: f.name,
        source: "runtime",
        sourceLabel: args.labels.runtime,
        mimeType: f.type,
        size: f.size,
        createdAt: f.lastModified,
        toFile: async () => f,
    }));

    const conversationItems: ContextFileSearchItem[] = [];
    for (const conversation of args.conversations ?? []) {
        const messages = (conversation.messages ?? []) as UIMessage[];
        const title = conversation?.metadata?.name ?? "Conversation";

        messages.forEach((message, msgIndex) => {
            (message.parts ?? []).forEach((part: any, partIndex: number) => {
                if (part?.type !== "file") return;
                const mediaType = part.mediaType || part.mimeType || "application/octet-stream";
                const name =
                    part.providerMetadata?.openai?.filename?.toString()
                    || part.filename
                    || `conversation-${msgIndex + 1}-attachment-${partIndex + 1}`;
                conversationItems.push({
                    id: `conversation:${conversation.id}:${msgIndex}:${partIndex}`,
                    name,
                    source: "conversation",
                    sourceLabel: args.labels.conversation,
                    mimeType: mediaType,
                    conversationTitle: title,
                    createdAt: Date.parse((message.metadata as any)?.timestamp as any) || conversation?.metadata?.updatedAt,
                    toFile: async () => filePartToFile(part as FileUIPart, name),
                });
            });
        });
    }

    return [...localItems, ...runtimeItems, ...conversationItems];
}

export function filterContextFileSearchItems(items: ContextFileSearchItem[], search: string) {
    const q = normalizeCatalogText(search);
    return (items ?? [])
        .filter((item) => {
            if (!q) return true;
            const hay = normalizeCatalogText(`${item.name} ${item.mimeType ?? ""} ${item.sourceLabel} ${item.conversationTitle ?? ""}`);
            return hay.includes(q);
        })
        .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", undefined, { sensitivity: "base", numeric: true }));
}

