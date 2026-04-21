import type { RealtimeResponse } from "aihappey-ai";
import type { RealtimeTranscriptionEvents } from "./startRealtimeWebrtcSession";

export type DeepgramRealtimeWsSession = {
    ws: WebSocket;
    stream: MediaStream;
    stop: () => Promise<void>;
};

const describeError = (e: unknown) => {
    if (!e) return "unknown";
    if (e instanceof Error) return e.message || e.name;
    try {
        return JSON.stringify(e);
    } catch {
        return String(e);
    }
};

const toNumber = (v: any): number | undefined => {
    const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
    return Number.isFinite(n) ? n : undefined;
};

const base64FromUint8Array = (bytes: Uint8Array): string => {
    // Chunk to avoid call stack limits on large arrays.
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
};

const pcm16leFromFloat32 = (input: Float32Array): Uint8Array => {
    const out = new Uint8Array(input.length * 2);
    const view = new DataView(out.buffer);
    for (let i = 0; i < input.length; i++) {
        let s = input[i] ?? 0;
        // Clamp
        if (s > 1) s = 1;
        else if (s < -1) s = -1;
        // Convert
        const v = s < 0 ? s * 0x8000 : s * 0x7fff;
        view.setInt16(i * 2, v, true);
    }
    return out;
};

const resampleLinear = (input: Float32Array, fromRate: number, toRate: number): Float32Array => {
    if (fromRate === toRate) return input;
    const ratio = fromRate / toRate;
    const outLength = Math.max(1, Math.round(input.length / ratio));
    const out = new Float32Array(outLength);
    for (let i = 0; i < outLength; i++) {
        const pos = i * ratio;
        const i0 = Math.floor(pos);
        const i1 = Math.min(i0 + 1, input.length - 1);
        const frac = pos - i0;
        out[i] = (1 - frac) * (input[i0] ?? 0) + frac * (input[i1] ?? 0);
    }
    return out;
};

const stripProviderPrefix = (modelId: string): string => {
    const idx = modelId.indexOf("/");
    return idx >= 0 ? modelId.slice(idx + 1) : modelId;
};

const buildDeepgramUrl = (args: { modelId: string; config: any }): string => {
    const url = new URL("wss://api.deepgram.com/v1/listen");

    // Required per docs.
    url.searchParams.set("model", stripProviderPrefix(args.modelId));

    // Optional query params come from config (flat map).
    //
    // For raw PCM streamed as binary from the browser, Deepgram generally expects `encoding` + `sample_rate`.
    // To keep "empty config" working, we apply safe minimal defaults *only if not provided*.
    const cfg = args.config ?? {};

    if (cfg.encoding === undefined && cfg.sample_rate === undefined && cfg.sampleRate === undefined) {
        url.searchParams.set("encoding", "linear16");
        url.searchParams.set("sample_rate", "16000");
    }

    for (const [k, v] of Object.entries(cfg)) {
        if (v === undefined || v === null || v === "") continue;
        url.searchParams.set(k, String(v));
    }

    return url.toString();
};

type DeepgramResultsMsg = {
    type?: "Results";
    channel?: {
        alternatives?: Array<{
            transcript?: string;
            words?: Array<{ start?: number; end?: number; punctuated_word?: string; word?: string }>;
        }>;
    };
    is_final?: boolean;
    speech_final?: boolean;
};

type DeepgramMetadataMsg = { type?: "Metadata" } & Record<string, any>;

export async function startDeepgramRealtimeWsSession(args: {
    getEphemeralToken: () => Promise<RealtimeResponse>;
    modelId: string;
    config: any;
    events?: RealtimeTranscriptionEvents;
}): Promise<DeepgramRealtimeWsSession> {
    const { events } = args;

    const token = await args.getEphemeralToken();
    const url = buildDeepgramUrl({ modelId: args.modelId, config: args.config });
    const ws = new WebSocket(url, ['bearer', token.value]);

    ws.binaryType = "arraybuffer";

    // Create media/audio nodes lazily (only after socket is confirmed open).
    // This avoids grabbing the microphone when the request is immediately rejected.
    let stream: MediaStream | undefined;
    let audioCtx: AudioContext | undefined;
    let source: MediaStreamAudioSourceNode | undefined;
    let processor: ScriptProcessorNode | undefined;

    // Track committed vs partial transcript. If `interim_results=true`, Deepgram will stream evolving text.
    // We'll keep the last final transcript and append partial previews.
    let committedText = "";

    // Emit a stream of finalized segments so the controller can build timestamp segments.
    // We do this here (provider-side) because Deepgram doesn't use OpenAI item_ids.
    let lastFinalTranscript = "";

    // Use config if provided; otherwise default to linear16 @ 16000 (common Deepgram example).
    // Deepgram typically needs encoding/sample_rate for raw PCM.
    const encoding = String(args.config?.encoding ?? "linear16");
    const targetSampleRate = toNumber(args.config?.sample_rate ?? args.config?.sampleRate) ?? 16000;

    // Best-effort session info (Deepgram Metadata messages, etc.)
    const safeEmitSessionCreated = (msg: any) => {
        try {
            events?.onSessionCreated?.(msg);
        } catch {
            // ignore
        }
    };

    // Deepgram can send fatal errors as WS close or as plain JSON.
    let fatalBeforeOpen: string | null = null;

    ws.addEventListener("message", (ev) => {
        try {
            if (typeof ev.data !== "string") {
                // Deepgram results/metadata are JSON strings; ignore unexpected binary.
                return;
            }
            const msg = JSON.parse(ev.data) as DeepgramResultsMsg | DeepgramMetadataMsg | any;
            events?.onEvent?.(msg);

            if (msg?.type === "Metadata") {
                safeEmitSessionCreated(msg);
                return;
            }

            if (msg?.type === "Results") {
                const alt = msg?.channel?.alternatives?.[0];
                const transcript = typeof alt?.transcript === "string" ? alt.transcript.trim() : "";
                if (!transcript) return;

                const isFinal = !!msg?.is_final || !!msg?.speech_final;

                if (isFinal) {
                    // Commit the finalized chunk to the overall transcript.
                    committedText = (committedText + (committedText ? " " : "") + transcript).trim();
                    events?.onTranscriptText?.(committedText);

                    // Also emit a synthetic event carrying word-level timings (if present)
                    // so the controller can create persisted segments.
                    try {
                        // Attempt to compute only the *new* finalized text portion.
                        const nextFinal = committedText;
                        let deltaFinal = transcript;
                        if (lastFinalTranscript && nextFinal.startsWith(lastFinalTranscript)) {
                            deltaFinal = nextFinal.slice(lastFinalTranscript.length).trim();
                        }
                        lastFinalTranscript = nextFinal;

                        events?.onEvent?.({
                            type: "Results",
                            is_final: true,
                            speech_final: true,
                            channel: {
                                alternatives: [
                                    {
                                        transcript: deltaFinal,
                                        words: Array.isArray(alt?.words) ? alt.words : undefined,
                                    },
                                ],
                            },
                        });
                    } catch {
                        // ignore
                    }
                } else {
                    // Preview: committed + current interim transcript.
                    events?.onTranscriptText?.((committedText + (committedText && transcript ? " " : "") + transcript).trim());
                }
                return;
            }

            // Some Deepgram errors show up with { error: "..." }.
            if (typeof msg?.error === "string" && msg.error) {
                const errMsg = msg.error;
                if (ws.readyState !== WebSocket.OPEN) fatalBeforeOpen = errMsg;
                events?.onError?.(errMsg);
            }
        } catch (e) {
            events?.onError?.(`Failed to parse Deepgram realtime event: ${describeError(e)}`, e);
        }
    });

    ws.addEventListener("error", (e) => {
        events?.onError?.("Deepgram realtime websocket error", e);
    });

    const opened = new Promise<void>((resolve, reject) => {
        const onOpen = () => {
            cleanup();
            resolve();
        };
        const onClose = () => {
            cleanup();
            reject(new Error(fatalBeforeOpen ?? "Deepgram realtime websocket closed before opening"));
        };
        const cleanup = () => {
            ws.removeEventListener("open", onOpen);
            ws.removeEventListener("close", onClose);
        };
        ws.addEventListener("open", onOpen);
        ws.addEventListener("close", onClose);
    });

    await opened;

    // Only now do we acquire the microphone and start producing audio.
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const track = stream.getAudioTracks()[0];
    if (!track) throw new Error("No microphone audio track available");

    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    source = audioCtx.createMediaStreamSource(stream);

    // ScriptProcessorNode is deprecated but widely supported and fine for MVP.
    const bufferSize = 4096;
    processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
    source.connect(processor);
    processor.connect(audioCtx.destination);

    processor.onaudioprocess = (event) => {
        try {
            if (ws.readyState !== WebSocket.OPEN) return;

            const input = event.inputBuffer.getChannelData(0);
            const resampled = resampleLinear(input, audioCtx.sampleRate, targetSampleRate);

            if (encoding !== "linear16") {
                // For now we only produce linear16 PCM from the browser.
                // If the user config requests something else, surface a clear error.
                events?.onError?.(`Deepgram realtime only supports encoding=linear16 in the browser implementation (got '${encoding}')`);
                return;
            }

            const pcm16 = pcm16leFromFloat32(resampled);
            // Deepgram expects raw binary audio frames (not base64 JSON).
            const bytes = new Uint8Array(new ArrayBuffer(pcm16.byteLength));
            bytes.set(pcm16);
            ws.send(bytes);
        } catch (e) {
            events?.onError?.(`Failed processing Deepgram audio chunk: ${describeError(e)}`, e);
        }
    };

    const stop = async () => {
        try {
            // Ask Deepgram to finalize if supported.
            try {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: "Finalize" }));
                }
            } catch {
                // ignore
            }

            try {
                processor?.disconnect();
            } catch {
                // ignore
            }
            try {
                source?.disconnect();
            } catch {
                // ignore
            }
            try {
                if (processor) processor.onaudioprocess = null;
            } catch {
                // ignore
            }

            try {
                await audioCtx?.close();
            } catch {
                // ignore
            }

            try {
                ws.close();
            } catch {
                // ignore
            }

            try {
                stream?.getTracks().forEach((t) => t.stop());
            } catch {
                // ignore
            }
        } catch (e) {
            events?.onError?.(`Failed stopping Deepgram realtime session: ${describeError(e)}`, e);
        }
    };

    return { ws, stream: stream!, stop };
}

