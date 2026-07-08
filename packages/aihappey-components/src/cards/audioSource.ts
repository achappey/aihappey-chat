// audioSource.ts

const DEFAULT_LINEAR16_SAMPLE_RATE = 24000;
const DEFAULT_LINEAR16_CHANNELS = 1;
const LINEAR16_BITS_PER_SAMPLE = 16;

type AudioObject = {
  base64?: string;
  data?: string;
  mimeType?: string;
  mime_type?: string;
  format?: string;
};

export type AudioSourceInput =
  | string
  | Uint8Array<ArrayBufferLike>
  | AudioObject
  | undefined;

type ParsedDataUri = {
  mimeType: string;
  parameters: Record<string, string>;
  base64: string;
};

const isAudioObject = (audio: unknown): audio is AudioObject =>
  !!audio && typeof audio === "object" && !(audio instanceof Uint8Array);

const decodeBase64 = (base64: string) =>
  Uint8Array.from(atob(base64), c => c.charCodeAt(0));

const getMimeTypeParts = (mimeType?: string) => {
  const parts = (mimeType ?? "")
    .split(";")
    .map(part => part.trim())
    .filter(Boolean);
  const type = parts[0]?.toLocaleLowerCase() ?? "";
  const parameters: Record<string, string> = {};

  for (const part of parts.slice(1)) {
    const [key, ...valueParts] = part.split("=");
    if (!key || valueParts.length === 0) continue;
    parameters[key.trim().toLocaleLowerCase()] = valueParts
      .join("=")
      .trim()
      .replace(/^"|"$/g, "");
  }

  return { type, parameters };
};

const parseDataUri = (audio: string): ParsedDataUri | undefined => {
  const match = audio.match(/^data:([^,]*),(.*)$/is);
  if (!match) return undefined;

  const [, metadata, data] = match;
  const { type, parameters } = getMimeTypeParts(metadata);
  if (parameters.base64 === undefined && !metadata.toLocaleLowerCase().includes(";base64")) {
    return undefined;
  }

  return {
    mimeType: type,
    parameters,
    base64: data,
  };
};

const getPositiveNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const isLinear16Pcm = (mimeType?: string, format?: string) => {
  const { type } = getMimeTypeParts(mimeType);
  const normalizedFormat = format?.trim().toLocaleLowerCase();

  return type === "audio/l16" || (!type && normalizedFormat === "pcm");
};

const toArrayBuffer = (bytes: Uint8Array) => {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
};

const pcmBytesToWavBlob = (
  pcmBytes: Uint8Array,
  options: { sampleRate?: number; channels?: number } = {}
) => {
  const sampleRate = options.sampleRate ?? DEFAULT_LINEAR16_SAMPLE_RATE;
  const channels = options.channels ?? DEFAULT_LINEAR16_CHANNELS;
  const bytesPerSample = LINEAR16_BITS_PER_SAMPLE / 8;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const wavBuffer = new ArrayBuffer(44 + pcmBytes.length);
  const view = new DataView(wavBuffer);

  let o = 0;
  const write = (s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o++, s.charCodeAt(i));
  };

  write("RIFF");
  view.setUint32(o, 36 + pcmBytes.length, true); o += 4;
  write("WAVE");
  write("fmt ");
  view.setUint32(o, 16, true); o += 4;
  view.setUint16(o, 1, true); o += 2; // PCM
  view.setUint16(o, channels, true); o += 2;
  view.setUint32(o, sampleRate, true); o += 4;
  view.setUint32(o, byteRate, true); o += 4;
  view.setUint16(o, blockAlign, true); o += 2;
  view.setUint16(o, LINEAR16_BITS_PER_SAMPLE, true); o += 2;
  write("data");
  view.setUint32(o, pcmBytes.length, true); o += 4;

  new Uint8Array(wavBuffer, 44).set(pcmBytes);

  return new Blob([wavBuffer], { type: "audio/wav" });
};

const blobUrl = (blob: Blob) => {
  const src = URL.createObjectURL(blob);
  return { src, revoke: () => URL.revokeObjectURL(src) };
};

/** detect PCM (LINEAR16) data URI */
export const isPcmDataUri = (audio?: string) => {
  if (typeof audio !== "string") return false;

  const parsed = parseDataUri(audio);
  if (!parsed) return false;

  return isLinear16Pcm(parsed.mimeType, parsed.parameters.codec);
};

/** PCM (LINEAR16) → WAV blob URL */
export const pcmDataUriToWavUrl = (dataUri: string): string => {
  const parsed = parseDataUri(dataUri);
  if (!parsed || !isLinear16Pcm(parsed.mimeType, parsed.parameters.codec)) {
    throw new Error("Invalid PCM data URI");
  }

  const { parameters, base64 } = parsed;
  const wavBlob = pcmBytesToWavBlob(decodeBase64(base64), {
    sampleRate: getPositiveNumber(parameters.rate, DEFAULT_LINEAR16_SAMPLE_RATE),
    channels: getPositiveNumber(parameters.channels, DEFAULT_LINEAR16_CHANNELS),
  });

  return URL.createObjectURL(wavBlob);
};

/**
 * Normalize any audio input into a playable URL.
 * Returns `{ src, revoke? }`
 */
export const normalizeAudioSource = (
  audio?: AudioSourceInput
): { src?: string; revoke?: () => void } => {
  if (!audio) return {};

  if (typeof audio === "string") {
    if (isPcmDataUri(audio)) {
      const wavUrl = pcmDataUriToWavUrl(audio);
      return { src: wavUrl, revoke: () => URL.revokeObjectURL(wavUrl) };
    }

    // mp3 / wav / ogg / blob / http / normal data URI
    return { src: audio };
  }

  if (audio instanceof Uint8Array) {
    return blobUrl(new Blob([toArrayBuffer(audio)], { type: "application/octet-stream" }));
  }

  if (isAudioObject(audio)) {
    const base64 = audio.base64 ?? audio.data;
    const mimeType = audio.mimeType ?? audio.mime_type;
    if (!base64) return {};

    if (isLinear16Pcm(mimeType, audio.format)) {
      return blobUrl(pcmBytesToWavBlob(decodeBase64(base64)));
    }

    return {
      src: `data:${mimeType ?? "application/octet-stream"};base64,${base64}`,
    };
  }

  return {};
};
