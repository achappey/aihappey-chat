// usePendingMessageAutoSend.ts
import { useEffect, useRef } from "react";

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

            await sendMessage(pending, { body });

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
    }, [conversationId, locationState, messages, addMessage, sendMessage, startRun, navigate, rename, getConversation, conversationName, body]);
}
