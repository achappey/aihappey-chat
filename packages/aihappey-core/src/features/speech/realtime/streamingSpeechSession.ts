import { base64ToUint8Array } from "aihappey-ai";
import type { SpeechProtocol } from "./speechProtocol";

export type StreamingSpeechSession = { append(text: string): void; flush(): void; finish(): Promise<void>; cancel(): void; dispose(): void };

/** One socket per text block: no audio or acknowledgements can leak into a later block/turn. */
export async function openStreamingSpeechSession(args: {
    protocol: SpeechProtocol; token: string; signal: AbortSignal; audio: (bytes: Uint8Array) => void; failed?: () => void;
}): Promise<StreamingSpeechSession> {
    const { protocol, signal } = args;
    signal.throwIfAborted();
    const url = new URL(protocol.url);
    if (protocol.provider === "cartesia") url.searchParams.set("access_token", args.token);
    const ws = protocol.provider === "deepgram" ? new WebSocket(url, ["bearer", args.token]) : new WebSocket(url);
    ws.binaryType = "arraybuffer";
    let closed = false, finishing = false, dirty = false, failure: Error | undefined;
    let sent = 0, acknowledged = 0, finalInputSent = false;
    let flushes: number[] = [];
    let resolveOpen!: () => void, rejectOpen!: (error: Error) => void, resolveDone!: () => void, rejectDone!: (error: Error) => void;
    const opened = new Promise<void>((resolve, reject) => { resolveOpen = resolve; rejectOpen = reject; });
    const done = new Promise<void>((resolve, reject) => { resolveDone = resolve; rejectDone = reject; });
    void done.catch(() => undefined);
    const fail = () => {
        failure ??= new Error("Streaming speech connection failed.");
        args.failed?.();
        rejectOpen(failure); rejectDone(failure);
    };
    const send = (message: object) => {
        signal.throwIfAborted();
        if (failure || closed || ws.readyState !== WebSocket.OPEN) throw failure ?? new Error("Streaming speech connection is closed.");
        if (ws.bufferedAmount > 512 * 1024) throw new Error("Streaming speech send backlog exceeded.");
        ws.send(JSON.stringify(message));
    };
    const flush = () => {
        if (!protocol.flush || !dirty || failure || closed) return;
        flushes = flushes.filter(time => Date.now() - time < 60_000);
        if (flushes.length >= 20 || flushes.length && Date.now() - flushes.at(-1)! < 3200) return;
        sent++; send(protocol.flush()); flushes.push(Date.now()); dirty = false;
    };
    const interval = setInterval(() => { try { flush(); } catch { fail(); } }, 200);
    const startup = setTimeout(() => { fail(); ws.close(); }, 15_000);
    const abort = () => { closed = true; fail(); ws.close(); };
    signal.addEventListener("abort", abort, { once: true });
    ws.onopen = () => { clearTimeout(startup); resolveOpen(); };
    ws.onerror = fail;
    ws.onclose = () => { if (!closed) fail(); };
    ws.onmessage = event => {
        if (closed || signal.aborted || failure) return;
        try {
            if (event.data instanceof ArrayBuffer) { args.audio(new Uint8Array(event.data)); return; }
            const message = JSON.parse(String(event.data));
            if (message.type === "error" || message.type === "Error" || message.type === "Warning") { fail(); return; }
            const audio = protocol.audio(message);
            if (audio) args.audio(base64ToUint8Array(audio));
            if (protocol.done(message)) {
                if (protocol.provider === "deepgram") {
                    if (!Number.isInteger(message.sequence_id) || message.sequence_id < 0) throw new Error("Invalid speech acknowledgment.");
                    acknowledged = Math.max(acknowledged, message.sequence_id + 1);
                }
                if (finalInputSent && (protocol.provider !== "deepgram" || acknowledged >= sent)) resolveDone();
            }
        } catch { fail(); }
    };
    const dispose = () => { if (closed) { clearInterval(interval); clearTimeout(startup); signal.removeEventListener("abort", abort); return; }
        closed = true; clearInterval(interval); clearTimeout(startup); signal.removeEventListener("abort", abort); ws.close(); };
    try { await opened; signal.throwIfAborted(); } catch (error) { dispose(); throw error; }
    return {
        append(text) { if (finishing) throw new Error("Speech input is complete.");
            // Deepgram limits each text message; splitting does not add or remove whitespace.
            for (let i = 0; i < text.length;) { let end = Math.min(i + 1000, text.length); if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1])) end--; send(protocol.append(text.slice(i, end))); i = end; dirty = true; }
        }, flush,
        async finish() {
            clearInterval(interval); finishing = true;
            const timeout = setTimeout(fail, 60_000);
            try {
                if (protocol.flush) {
                    while (dirty) { flush(); if (dirty) { signal.throwIfAborted(); if (failure) throw failure; await new Promise(resolve => setTimeout(resolve, 100)); } }
                    finalInputSent = true;
                    if (acknowledged >= sent) resolveDone();
                } else { finalInputSent = true; send(protocol.finish()); }
                await done; signal.throwIfAborted();
            } finally { clearTimeout(timeout); }
        },
        cancel() { try { if (!closed && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(protocol.cancel())); } catch {} dispose(); }, dispose,
    };
}
