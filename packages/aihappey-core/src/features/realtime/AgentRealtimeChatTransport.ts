import { ManagedAgentChatTransport } from "../chat/engine/ManagedAgentChatTransport";

/** Observe semantic completion chunks without buffering or modifying the normal agent stream. */
export class AgentRealtimeChatTransport extends ManagedAgentChatTransport {
    constructor(options: ConstructorParameters<typeof ManagedAgentChatTransport>[0], private observe: (chunk: any) => void,
        private resolveMessageId: (id: string) => string = id => id) { super(options); }
    protected processResponseStream(stream: ReadableStream<Uint8Array>) {
        return super.processResponseStream(stream).pipeThrough(new TransformStream({
            transform: (chunk, controller) => {
                // Provider IDs may be reused on later user turns. They must not select an
                // earlier SDK message and overwrite history instead of rendering a reply.
                const next = chunk.type === "start" && chunk.messageId
                    ? { ...chunk, messageId: this.resolveMessageId(chunk.messageId) } : chunk;
                this.observe(next); controller.enqueue(next);
            },
        }));
    }
}
