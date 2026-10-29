import type { StreamingSpeechSession } from "../speech/realtime/streamingSpeechSession";

type Block = { text: string; pending: string[]; ended: boolean; wake?: () => void };

/** Observes text only. Socket setup, speech generation and playback never backpressure the LLM. */
export class StreamingAgentSpeech {
    private tail = Promise.resolve();
    private blocks = new Map<string, Block>();
    private played = false;
    private failed = false;
    private reported = false;
    private retained = 0;
    constructor(private options: {
        signal: AbortSignal;
        open: (started: () => void) => Promise<StreamingSpeechSession>;
        legacy: (text: string, signal: AbortSignal) => Promise<void>;
        error: (error: unknown) => void;
    }) {
        options.signal.addEventListener("abort", () => { for (const block of this.blocks.values()) block.wake?.(); this.blocks.clear(); }, { once: true });
    }
    response(prefix: string) {
        const ids = new Set<string>();
        let observed = false;
        return {
            handle: (chunk: any) => {
                if (this.options.signal.aborted) return;
                if (!["text-start", "text-delta", "text-end"].includes(chunk.type)) return;
                observed = true;
                const key = `${prefix}:${String(chunk.id ?? "")}`; ids.add(key);
                if (chunk.type === "text-delta") this.append(key, String(chunk.delta ?? ""));
                if (chunk.type === "text-end") this.end(key);
            },
            finish: (message: any) => {
                if (!observed) {
                    const key = `${prefix}:final`;
                    this.append(key, (message?.parts ?? []).filter((part: any) => part.type === "text").map((part: any) => part.text).join("\n"));
                    this.end(key);
                }
                for (const id of ids) this.end(id);
            },
        };
    }
    private append(key: string, delta: string) {
        if (!delta || this.options.signal.aborted) return;
        let block = this.blocks.get(key);
        if (block?.ended) return;
        // A bad/overlong stream must not retain unbounded text while playback is slower than inference.
        if (this.retained + delta.length > 128_000) {
            this.failed = true;
            if (!this.reported) { this.reported = true; this.options.error(new Error("Speech text backlog exceeded.")); }
            return;
        }
        this.retained += delta.length;
        if (!block) {
            block = { text: "", pending: [], ended: false }; this.blocks.set(key, block);
            const current = block;
            this.tail = this.tail.then(() => this.play(current)).catch(error => { if (!this.options.signal.aborted) this.options.error(error); });
        }
        block.text += delta; block.pending.push(delta); block.wake?.();
    }
    private end(key: string) { const block = this.blocks.get(key); if (block) { block.ended = true; block.wake?.(); } }
    private async wait(block: Block) {
        if (this.options.signal.aborted) return;
        await new Promise<void>(resolve => { block.wake = resolve; }); block.wake = undefined;
    }
    private async play(block: Block) {
        const { signal } = this.options;
        let session: StreamingSpeechSession | undefined;
        try {
            signal.throwIfAborted();
            if (this.failed) throw new Error("Streaming speech is unavailable for this turn.");
            session = await this.options.open(() => { this.played = true; });
            while (!signal.aborted && (!block.ended || block.pending.length)) {
                for (const delta of block.pending.splice(0)) session.append(delta);
                if (!block.ended) await this.wait(block);
            }
            signal.throwIfAborted(); await session.finish();
        } catch (error) {
            session?.cancel(); this.failed = true;
            while (!block.ended && !signal.aborted) await this.wait(block);
            if (!signal.aborted) {
                if (!this.played) {
                    try { await this.options.legacy(block.text, signal); }
                    catch (legacyError) { if (!signal.aborted) this.options.error(legacyError); }
                } else if (!this.reported) { this.reported = true; this.options.error(error); }
            }
        } finally { session?.dispose(); this.retained -= block.text.length; block.pending = []; }
    }
}
