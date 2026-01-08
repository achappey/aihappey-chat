// usePendingMessageAutoSend.ts
import { useEffect, useRef } from "react";
import type { FileItem, FileStore } from "aihappey-files";
import { withOpenAiKnownSpeakerReferences } from "../../transcriptions/knownSpeakersProviderMetadata";

type Args = {
    conversationId?: string;
    locationState: any;
    messages: any[];
    addMessage: (cid: string, msg: any) => Promise<void>;
    sendMessage: (msg: any, opts: any) => Promise<void>;
    startRun: () => void;
    navigate: (to: string, opts: any) => Promise<void> | void;
    rename: (cid: string, name: string) => void;
    getConversation: (cid: string) => Promise<any>;
    conversationName: (text: string) => Promise<string | undefined>;
    body: any;
    files?: FileStore & { items?: FileItem[] };
};

export function usePendingMessageAutoSend({
    conversationId,
    locationState,
    messages,
    addMessage,
    sendMessage,
    startRun,
    navigate,
    rename,
    getConversation,
    conversationName,
    body,
    files,
}: Args) {
    const didRef = useRef(false);

    useEffect(() => {
        const pending = locationState?.pendingMessage;
        if (!pending || !conversationId) return;

        if (didRef.current) return;
        didRef.current = true;

        const run = async () => {
            await addMessage(conversationId, pending);
            startRun();

            // Important for the "new chat first message" flow:
            // `useActiveProviderMetadata()` hydrates known speaker references asynchronously
            // (needs files IndexedDB listing). When we auto-send immediately after navigation,
            // that hydration can still be pending.
            //
            // So we ensure OpenAI transcription metadata is hydrated right before sending.
            const baseProviderMetadata = body?.providerMetadata;
            let hydratedProviderMetadata = baseProviderMetadata;

            if (files && baseProviderMetadata) {
                const items = Array.isArray((files as any).items) && (files as any).items.length
                    ? (files as any).items
                    : await files.list();

                const knownSpeakerNames: string[] | undefined = (baseProviderMetadata as any)?.openai?.known_speaker_names;
                hydratedProviderMetadata = await withOpenAiKnownSpeakerReferences(baseProviderMetadata, {
                    items,
                    files,
                    knownSpeakerNames,
                });
            }

            const nextBody = hydratedProviderMetadata === baseProviderMetadata
                ? body
                : { ...body, providerMetadata: hydratedProviderMetadata };

            await sendMessage(pending, { body: nextBody });

            await navigate(`/${conversationId}`, { replace: true, state: {} });

            const name = await conversationName(
                (pending?.parts ?? [])
                    .filter((p: any) => p.type === "text")
                    .map((p: any) => p.text)
                    .join("\n\n")
            );

            if (name) {
                document.title = name;
                rename(conversationId, name);
            }

            // optional debug
            await getConversation(conversationId);
        };

        run();
    }, [conversationId, locationState, messages, addMessage,
        sendMessage, startRun, navigate, rename, getConversation, conversationName, body, files]);
}
