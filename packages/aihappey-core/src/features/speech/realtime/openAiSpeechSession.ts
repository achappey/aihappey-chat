import { base64ToUint8Array } from "aihappey-ai";
import type { StreamingSpeechSession } from "./streamingSpeechSession";
import { buildOpenAiSpeechSession, openAiSpeechInstructions, openAiSpeechRate } from "./openAiSpeechConfig";

/** Preserve every character; batch at sentence/word boundaries, never one response per LLM token. */
export function openAiSpeechBatchLength(text: string, final: boolean) {
    const boundary = /[.!?]["')\]]*\s+|\n/.exec(text);
    if (boundary && boundary.index + boundary[0].length <= 1000) return boundary.index + boundary[0].length;
    if (text.length <= 1000) return final ? text.length : 0;
    let end = Math.max(text.lastIndexOf(" ", 1000), text.lastIndexOf("\n", 1000));
    if (end <= 0) end = 1000;
    if (/[\uD800-\uDBFF]/.test(text[end - 1])) end--;
    return end;
}

/** A block-owned, output-only GA session. No microphone, conversation history, tools or API-key fallback. */
export async function openOpenAiSpeechSession(args: {
    model: string; options?: Record<string, unknown>; token: string; signal: AbortSignal;
    audio: (bytes: Uint8Array) => void; failed?: () => void;
}): Promise<StreamingSpeechSession> {
    const session = buildOpenAiSpeechSession(args.model, args.options);
    args.signal.throwIfAborted();
    if (!/^ek_[A-Za-z0-9_-]+$/.test(args.token)) throw new Error("OpenAI speech requires a short-lived Realtime client secret.");
    const url = new URL("wss://api.openai.com/v1/realtime"); url.searchParams.set("model", session.model);
    const ws = new WebSocket(url, ["realtime", `openai-insecure-api-key.${args.token}`]);
    let closed = false, ready = false, finishing = false, forceFlush = false, completed = false;
    let pending = "", failure: Error | undefined;
    let active: { request: string; id?: string; bytes: number } | undefined;
    let responseTimeout: ReturnType<typeof setTimeout> | undefined;
    let resolveReady!: () => void, rejectReady!: (error: Error) => void;
    let resolveDone!: () => void, rejectDone!: (error: Error) => void;
    const started = new Promise<void>((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
    const done = new Promise<void>((resolve, reject) => { resolveDone = resolve; rejectDone = reject; });
    void started.catch(() => undefined); void done.catch(() => undefined);
    const send = (message: object) => {
        args.signal.throwIfAborted();
        if (closed || failure || ws.readyState !== WebSocket.OPEN || ws.bufferedAmount > 512 * 1024)
            throw failure ?? new Error("OpenAI speech connection is unavailable.");
        ws.send(JSON.stringify(message));
    };
    const dispose = () => {
        if (closed) return;
        closed = true; pending = ""; active = undefined;
        clearTimeout(startup); clearTimeout(responseTimeout);
        args.signal.removeEventListener("abort", abort);
        ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
        ws.close();
    };
    const fail = (message = "OpenAI Realtime speech failed.") => {
        if (closed || completed) return;
        failure ??= new Error(message);
        rejectReady(failure); rejectDone(failure);
        args.failed?.(); dispose();
    };
    const pump = () => {
        if (!ready || active || closed || failure) return;
        const count = openAiSpeechBatchLength(pending, finishing || forceFlush);
        if (!count) {
            if (finishing && !pending.length) { completed = true; resolveDone(); }
            return;
        }
        const text = pending.slice(0, count); pending = pending.slice(count);
        if (!text.trim()) { pump(); return; }
        active = { request: crypto.randomUUID(), bytes: 0 };
        // Out-of-band responses cannot repeat earlier batches or accumulate instructions/history.
        send({ type: "response.create", response: { conversation: "none", output_modalities: ["audio"],
            instructions: openAiSpeechInstructions, tools: [], tool_choice: "none",
            metadata: { speech_request: active.request },
            input: [{ type: "message", role: "user", content: [{ type: "input_text", text }] }] } });
        responseTimeout = setTimeout(() => fail("OpenAI speech response timed out."), 60_000);
    };
    const cancel = () => {
        if (closed) return;
        try { if (active?.id && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "response.cancel", response_id: active.id })); } catch { /* Socket teardown still cancels an unacknowledged request. */ }
        fail("OpenAI speech cancelled.");
        dispose();
    };
    const abort = () => cancel();
    const startup = setTimeout(() => fail("OpenAI speech session setup timed out."), 15_000);
    args.signal.addEventListener("abort", abort, { once: true });
    ws.onopen = () => {
        try {
            const { model: _, ...update } = session;
            send({ type: "session.update", session: update });
        } catch { fail(); }
    };
    ws.onerror = () => fail("OpenAI speech WebSocket connection failed.");
    ws.onclose = () => { if (!completed) fail("OpenAI speech connection closed before completion."); };
    ws.onmessage = event => {
        if (closed || completed || args.signal.aborted) return;
        try {
            if (typeof event.data !== "string" || event.data.length > 1024 * 1024) throw new Error();
            const message = JSON.parse(event.data);
            if (message.type === "error") { fail(); return; } // Never expose upstream bodies or credentials.
            if (message.type === "session.updated") {
                if (ready) return;
                const result = message.session;
                if (result?.type !== "realtime" || result?.audio?.output?.format?.type !== "audio/pcm"
                    || result.audio.output.format.rate !== openAiSpeechRate || result.audio?.input?.turn_detection != null
                    || result.output_modalities?.length !== 1 || result.output_modalities[0] !== "audio"
                    || result.tools?.length || result.audio.output.voice !== session.audio.output.voice) throw new Error();
                ready = true; clearTimeout(startup); resolveReady(); return;
            }
            if (!ready || !active) return;
            if (message.type === "response.created") {
                if (message.response?.metadata?.speech_request !== active.request) return;
                if (typeof message.response.id !== "string" || !message.response.id || active.id && active.id !== message.response.id) throw new Error();
                active.id = message.response.id; return;
            }
            if (!active.id) return;
            if (message.type === "response.output_audio.delta" && message.response_id === active.id) {
                if (typeof message.delta !== "string") throw new Error();
                const bytes = base64ToUint8Array(message.delta);
                active.bytes += bytes.length;
                if (active.bytes > 4 * 1024 * 1024) throw new Error();
                if (bytes.length) args.audio(bytes);
            }
            if (message.type === "response.done" && message.response?.id === active.id) {
                if (message.response.status !== "completed" || !active.bytes || active.bytes % 2) throw new Error();
                clearTimeout(responseTimeout); active = undefined; pump();
            }
        } catch { fail(); }
    };
    try { await started; args.signal.throwIfAborted(); }
    catch (error) { dispose(); throw error; }
    return {
        append(text) {
            args.signal.throwIfAborted();
            if (failure || closed || finishing) throw failure ?? new Error("OpenAI speech input is closed.");
            if (pending.length + text.length > 128_000) { fail("OpenAI speech text backlog exceeded."); throw failure; }
            pending += text;
            try { pump(); } catch { fail(); throw failure; }
        },
        flush() { forceFlush = true; try { pump(); } catch { fail(); } },
        async finish() {
            args.signal.throwIfAborted();
            if (failure) throw failure;
            finishing = true;
            try { pump(); await done; args.signal.throwIfAborted(); }
            finally { dispose(); }
        },
        cancel,
        dispose() { if (!completed) cancel(); else dispose(); },
    };
}
