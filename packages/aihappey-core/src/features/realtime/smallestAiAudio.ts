/** Shared Smallest AI browser plumbing. Only short-lived credentials reach these sockets. */
export const smallestAiConnectionError =
  "Smallest AI WebSocket connection failed. The browser does not expose the handshake HTTP status. Check token expiry and permissions. No API-key fallback was attempted.";

export function smallestAiProviderError(event: any): string {
  const code = String(event?.error_code ?? event?.code ?? event?.status_code ?? "unknown");
  const message = String(event?.message ?? event?.error ?? "Provider error");
  return `Smallest AI (${code}): ${message}${code === "401" || /unauthori[sz]ed|region|token/i.test(code + " " + message)
    ? " Authentication failed; request a fresh short-lived token from the gateway. No API-key fallback was attempted." : ""}`;
}

export function waitForSmallestAiSocket(ws: WebSocket, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const finish = (error?: Error) => {
      clearTimeout(timer);
      ws.removeEventListener("open", opened);
      ws.removeEventListener("error", failed);
      ws.removeEventListener("close", failed);
      signal?.removeEventListener("abort", aborted);
      if (error) reject(error); else resolve();
    };
    const opened = () => finish();
    const failed = () => finish(new Error(smallestAiConnectionError));
    const aborted = () => { finish(new Error("Smallest AI connection cancelled.")); ws.close(); };
    const timer = setTimeout(() => finish(new Error("Smallest AI WebSocket connection timed out.")), 15000);
    ws.addEventListener("open", opened);
    ws.addEventListener("error", failed);
    ws.addEventListener("close", failed);
    signal?.addEventListener("abort", aborted, { once: true });
    if (signal?.aborted) aborted();
    else if (ws.readyState === WebSocket.OPEN) opened();
  });
}

export function encodeSmallestAiPcm(input: Float32Array, inputRate: number, outputRate: number): ArrayBuffer {
  const length = Math.max(1, Math.round(input.length * outputRate / inputRate));
  const output = new ArrayBuffer(length * 2);
  const view = new DataView(output);
  for (let i = 0; i < length; i++) {
    const position = i * inputRate / outputRate;
    const low = Math.floor(position);
    const sample = Math.max(-1, Math.min(1, (input[low] ?? 0) + ((input[Math.min(low + 1, input.length - 1)] ?? 0) - (input[low] ?? 0)) * (position - low)));
    view.setInt16(i * 2, sample < 0 ? sample * 32768 : sample * 32767, true);
  }
  return output;
}

export async function createSmallestAiCapture(args: {
  microphoneStream?: MediaStream;
  signal?: AbortSignal;
  rate?: number;
  onAudio: (bytes: ArrayBuffer) => void;
}) {
  args.signal?.throwIfAborted();
  const owned = !args.microphoneStream;
  const stream = args.microphoneStream ?? await navigator.mediaDevices.getUserMedia({ audio: true });
  let context: AudioContext | undefined;
  let source: MediaStreamAudioSourceNode | undefined;
  let processor: ScriptProcessorNode | undefined;
  let silent: GainNode | undefined;
  let closed = false;
  const stop = async () => {
    if (closed) return;
    closed = true;
    if (processor) processor.onaudioprocess = null;
    processor?.disconnect(); source?.disconnect(); silent?.disconnect();
    if (owned) stream.getTracks().forEach(track => track.stop());
    if (context && context.state !== "closed") await context.close();
  };
  try {
    args.signal?.throwIfAborted();
    context = new AudioContext();
    await context.resume();
    args.signal?.throwIfAborted();
    source = context.createMediaStreamSource(stream);
    processor = context.createScriptProcessor(2048, 1, 1);
    silent = context.createGain(); silent.gain.value = 0;
    source.connect(processor); processor.connect(silent); silent.connect(context.destination);
    processor.onaudioprocess = event => {
      if (!closed && !args.signal?.aborted)
        args.onAudio(encodeSmallestAiPcm(event.inputBuffer.getChannelData(0), context!.sampleRate, args.rate ?? context!.sampleRate));
    };
    return { stream, rate: args.rate ?? context.sampleRate, stop };
  } catch (error) { await stop(); throw error; }
}
