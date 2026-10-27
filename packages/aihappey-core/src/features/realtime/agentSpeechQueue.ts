/** A session-owned, ordered, cancellable queue. Inference never waits for audio playback. */
export class AgentSpeechQueue {
    private controller = new AbortController();
    private tail = Promise.resolve();
    private seen = new Set<string>();
    constructor(private play: (text: string, signal: AbortSignal) => Promise<void>, private error: (error: unknown) => void) {}
    enqueue(key: string, text: string) {
        if (!text.trim() || this.seen.has(key)) return;
        this.seen.add(key);
        const signal = this.controller.signal;
        this.tail = this.tail.then(async () => {
            if (signal.aborted) return;
            try { await this.play(text, signal); } catch (error) { if (!signal.aborted) this.error(error); }
        });
    }
    clear() {
        this.controller.abort();
        this.controller = new AbortController();
        this.tail = Promise.resolve();
        this.seen.clear();
    }
}

/** SDK text-end chunks are authoritative, even when the same message continues with tools. */
export class CompletedAgentText {
    private blocks = new Map<string, string>();
    private completed = new Set<string>();
    constructor(private speak: (key: string, text: string) => void) {}
    handle(chunk: any) {
        const id = String(chunk.id ?? "");
        if (chunk.type === "text-start") this.blocks.set(id, "");
        if (chunk.type === "text-delta") this.blocks.set(id, (this.blocks.get(id) ?? "") + String(chunk.delta ?? ""));
        if (chunk.type === "text-end" && !this.completed.has(id)) {
            this.completed.add(id);
            this.speak(id, this.blocks.get(id) ?? "");
        }
    }
    finish(message: any) {
        // Older transports may not expose text-end. Only their final completed answer is safe.
        if (!this.completed.size) this.speak(`final:${message?.id}`, (message?.parts ?? [])
            .filter((part: any) => part.type === "text").map((part: any) => part.text).join("\n"));
    }
}
