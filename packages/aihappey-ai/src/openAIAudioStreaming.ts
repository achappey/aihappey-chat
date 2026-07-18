export type OpenAITranscriptionStreamEvent =
  | { type: "transcript.text.delta"; delta: string; segment_id?: string }
  | { type: "transcript.text.done"; text: string; usage?: unknown }
  | { type: string; [key: string]: unknown };

export type OpenAISpeechStreamEvent =
  | { type: "speech.audio.delta"; audio: string }
  | { type: "speech.audio.done"; usage?: unknown }
  | { type: string; [key: string]: unknown };

export type OpenAISpeechFormat = "mp3" | "wav" | "opus" | "aac" | "flac" | "pcm";

export const OPENAI_SPEECH_FORMATS: OpenAISpeechFormat[] = [
  "mp3",
  "wav",
  "opus",
  "aac",
  "flac",
  "pcm",
];

const SPEECH_FORMAT_INFO: Record<OpenAISpeechFormat, { mimeType: string; extension: string }> = {
  mp3: { mimeType: "audio/mpeg", extension: "mp3" },
  wav: { mimeType: "audio/wav", extension: "wav" },
  opus: { mimeType: "audio/ogg; codecs=opus", extension: "opus" },
  aac: { mimeType: "audio/aac", extension: "aac" },
  flac: { mimeType: "audio/flac", extension: "flac" },
  pcm: { mimeType: "audio/pcm", extension: "pcm" },
};

export const getOpenAISpeechFormatInfo = (format: OpenAISpeechFormat) =>
  SPEECH_FORMAT_INFO[format];

export const base64ToUint8Array = (value: string): Uint8Array => {
  const normalized = value.includes(",") ? value.slice(value.indexOf(",") + 1) : value;
  const binary = atob(normalized.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

export const concatUint8Arrays = (chunks: Uint8Array[]): Uint8Array => {
  const length = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
};

export const createTimestampedFileName = (prefix: string, extension: string, date = new Date()) => {
  const stamp = date.toISOString().replace(/[:.]/g, "-");
  return `${prefix}-${stamp}.${extension}`;
};

const extractErrorMessage = (payload: unknown): string | undefined => {
  if (!payload || typeof payload !== "object") return undefined;
  const value = payload as any;
  if (typeof value.error === "string") return value.error;
  if (typeof value.error?.message === "string") return value.error.message;
  if (typeof value.message === "string") return value.message;
  return undefined;
};

export type ReadOpenAISseOptions<T> = {
  url: string;
  init: RequestInit;
  fetch?: typeof globalThis.fetch;
  signal?: AbortSignal;
  onEvent: (event: T) => void | Promise<void>;
};

/** Reads OpenAI-style SSE from a POST response, including events split across network chunks. */
export const readOpenAISse = async <T>({
  url,
  init,
  fetch: customFetch,
  signal,
  onEvent,
}: ReadOpenAISseOptions<T>): Promise<void> => {
  const fetcher = customFetch ?? globalThis.fetch;
  const response = await fetcher(url, { ...init, signal: signal ?? init.signal });

  if (!response.ok) {
    const body = await response.text();
    let message = body;
    try {
      message = extractErrorMessage(JSON.parse(body)) ?? body;
    } catch {
      // Keep plain-text backend errors.
    }
    throw new Error(message || `Request failed (${response.status} ${response.statusText})`);
  }

  if (!response.body) throw new Error("Streaming response body is not available.");

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("text/event-stream")) {
    throw new Error(`Expected text/event-stream but received ${contentType || "an unknown content type"}.`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finished = false;

  const consume = async (rawEvent: string) => {
    const data = rawEvent
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n")
      .trim();

    if (!data) return;
    if (data === "[DONE]") {
      finished = true;
      return;
    }

    let event: any;
    try {
      event = JSON.parse(data);
    } catch {
      throw new Error("The server returned an invalid streaming event.");
    }

    const error = extractErrorMessage(event);
    if (error) throw new Error(error);
    await onEvent(event as T);
  };

  try {
    while (!finished) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

      let match = /\r?\n\r?\n/.exec(buffer);
      while (match) {
        const rawEvent = buffer.slice(0, match.index);
        buffer = buffer.slice(match.index + match[0].length);
        await consume(rawEvent);
        if (finished) break;
        match = /\r?\n\r?\n/.exec(buffer);
      }

      if (done) break;
    }

    if (!finished && buffer.trim()) await consume(buffer);
  } finally {
    reader.releaseLock();
  }
};

/** Wraps OpenAI 24 kHz mono signed 16-bit little-endian PCM for browser playback. */
export const pcm16ToWav = (pcm: Uint8Array, sampleRate = 24_000): Uint8Array => {
  const output = new Uint8Array(44 + pcm.byteLength);
  const view = new DataView(output.buffer);
  const writeAscii = (offset: number, text: string) => {
    for (let index = 0; index < text.length; index += 1) output[offset + index] = text.charCodeAt(index);
  };
  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + pcm.byteLength, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, "data");
  view.setUint32(40, pcm.byteLength, true);
  output.set(pcm, 44);
  return output;
};
