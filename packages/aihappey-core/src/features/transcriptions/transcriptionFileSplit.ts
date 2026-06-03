import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export type TranscriptionFileChunk = {
  file: File;
  index: number;
  total: number;
  startSecond: number;
  endSecond: number;
};

export type TranscriptionFileSplitResult = {
  chunks: TranscriptionFileChunk[];
  durationInSeconds?: number;
  split: boolean;
};

export type TranscriptionFileSplitOptions = {
  enabled?: boolean;
  maxChunkSizeMb?: number;
  overlapSeconds?: number;
};

const MB = 1024 * 1024;
const REQUEST_JSON_HEADROOM_BYTES = 1 * MB;
const BASE64_EXPANSION_FACTOR = 4 / 3;
// The @ffmpeg/ffmpeg class worker is a module worker in bundled apps, so use
// the ESM core. Passing an explicit classWorkerURL avoids the package trying to
// construct a relative worker URL from the bundled module location.
const FFMPEG_CORE_CDN_BASE_URL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";
const FFMPEG_CLASS_WORKER_CDN_URL = "https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/esm/worker.js";

// These are browser URLs, not filesystem paths.
// They must match what esbuild copies into public:
//
// public/ffmpeg/ffmpeg/worker.js
// public/ffmpeg/core/ffmpeg-core.js
// public/ffmpeg/core/ffmpeg-core.wasm
const LOCAL_FFMPEG_CLASS_WORKER_URL = "ffmpeg/ffmpeg/worker.js";
const LOCAL_FFMPEG_CORE_URL = "ffmpeg/core/ffmpeg-core.js";
const LOCAL_FFMPEG_WASM_URL = "ffmpeg/core/ffmpeg-core.wasm";

let ffmpegPromise: Promise<FFmpeg> | undefined;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, message: string) => {
  let timeout: number | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = window.setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout !== undefined) window.clearTimeout(timeout);
  }
};

// Important: use document.baseURI instead of window.location.origin.
// This also works when the app is hosted under a subpath.
const browserUrl = (url: string) => new URL(url, document.baseURI).toString();

const fetchOkAndNotHtml = async (url: string) => {
  const response = await fetch(browserUrl(url), {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) return false;

  const contentType = response.headers.get("content-type") ?? "";

  // If your SPA fallback returns index.html for missing files,
  // response.ok can still be true. That would break ffmpeg with weird errors.
  if (contentType.includes("text/html")) return false;

  return true;
};

const browserFfmpegAssetsAvailable = async () => {
  try {
    const [classWorkerOk, coreOk, wasmOk] = await Promise.all([
      fetchOkAndNotHtml(LOCAL_FFMPEG_CLASS_WORKER_URL),
      fetchOkAndNotHtml(LOCAL_FFMPEG_CORE_URL),
      fetchOkAndNotHtml(LOCAL_FFMPEG_WASM_URL),
    ]);

    return classWorkerOk && coreOk && wasmOk;
  } catch {
    return false;
  }
};

const getFfmpegLoadConfig = async () => {
  if (await browserFfmpegAssetsAvailable()) {
    return {
      classWorkerURL: browserUrl(LOCAL_FFMPEG_CLASS_WORKER_URL),
      coreURL: browserUrl(LOCAL_FFMPEG_CORE_URL),
      wasmURL: browserUrl(LOCAL_FFMPEG_WASM_URL),
    };
  }

  return {
    classWorkerURL: await toBlobURL(FFMPEG_CLASS_WORKER_CDN_URL, "text/javascript"),
    coreURL: await toBlobURL(`${FFMPEG_CORE_CDN_BASE_URL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${FFMPEG_CORE_CDN_BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
  };
};

const withoutExtension = (name: string) => name.replace(/\.[^./\\]+$/, "");

const getInputExtension = (file: File) => {
  const match = file.name.match(/\.([^.]+)$/);
  if (match?.[1]) return match[1].toLowerCase();
  if (file.type.includes("mp4") || file.type.includes("m4a")) return "m4a";
  if (file.type.includes("mpeg")) return "mp3";
  if (file.type.includes("webm")) return "webm";
  if (file.type.includes("ogg")) return "ogg";
  if (file.type.includes("wav")) return "wav";
  return "bin";
};

const isVideoFile = (file: File) => file.type.startsWith("video/");

const getFfmpeg = async () => {
  ffmpegPromise ??= (async () => {
    const ffmpeg = new FFmpeg();
    ffmpeg.on("log", ({ type, message }) => {
      console.debug(`[ffmpeg:${type}] ${message}`);
    });

    ffmpeg.on("progress", ({ progress, time }) => {
      const pct = Number.isFinite(progress)
        ? Math.round(progress * 100)
        : 0;

      console.log(
        `[ffmpeg]: ${pct}% (${(time / 1_000_000).toFixed(1)}s)`
      );
    });

    console.log("[ffmpeg] loading wasm...");

    await withTimeout(
      ffmpeg.load(await getFfmpegLoadConfig()),
      30_000,
      "Timed out loading ffmpeg.wasm"
    );
    return ffmpeg;
  })();

  try {
    return await ffmpegPromise;
  } catch (error) {
    ffmpegPromise = undefined;
    throw error;
  }
};

const fileDataToUint8Array = (data: unknown) => {
  if (data instanceof Uint8Array) return data;
  if (typeof data === "string") return new TextEncoder().encode(data);
  return new Uint8Array(data as ArrayBuffer);
};

const toArrayBuffer = (data: Uint8Array) => {
  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(data);
  return buffer;
};

const readTextFile = async (ffmpeg: FFmpeg, path: string) => {
  const data = await ffmpeg.readFile(path, "utf8");
  if (typeof data === "string") return data;
  return new TextDecoder().decode(fileDataToUint8Array(data));
};

const probeDuration = async (ffmpeg: FFmpeg, inputName: string) => {
  const outputName = `${inputName}.duration.txt`;
  await ffmpeg.ffprobe([
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    inputName,
    "-o", outputName,
  ]);

  const text = await readTextFile(ffmpeg, outputName);
  await ffmpeg.deleteFile(outputName).catch(() => undefined);
  const duration = Number.parseFloat(text.trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Could not determine media duration");
  }
  return duration;
};

const createRanges = (durationInSeconds: number, fileSize: number, maxChunkSizeBytes: number, overlapSecondsInput: number) => {
  const chunkDurationSeconds = Math.max(1, durationInSeconds * (maxChunkSizeBytes / fileSize));
  const overlapSeconds = Math.min(Math.max(0, overlapSecondsInput), Math.max(0, chunkDurationSeconds - 0.25));
  const strideSeconds = Math.max(0.25, chunkDurationSeconds - overlapSeconds);
  const ranges: Array<{ startSecond: number; endSecond: number }> = [];

  for (let startSecond = 0; startSecond < durationInSeconds; startSecond += strideSeconds) {
    const endSecond = Math.min(durationInSeconds, startSecond + chunkDurationSeconds);
    ranges.push({ startSecond, endSecond });
    if (endSecond >= durationInSeconds) break;
  }

  return ranges;
};

const splitWithFfmpeg = async (
  file: File,
  maxChunkSizeBytes: number,
  overlapSeconds: number
): Promise<TranscriptionFileSplitResult> => {
  const ffmpeg = await getFfmpeg();
  const inputName = `input-${Date.now()}-${Math.random().toString(36).slice(2)}.${getInputExtension(file)}`;
  const baseName = withoutExtension(file.name);

  await ffmpeg.writeFile(inputName, await fetchFile(file));

  try {
    const durationInSeconds = await probeDuration(ffmpeg, inputName);
    const targetPayloadBytes = Math.max(1 * MB, Math.floor((maxChunkSizeBytes - REQUEST_JSON_HEADROOM_BYTES) / BASE64_EXPANSION_FACTOR));
    const ranges = createRanges(durationInSeconds, file.size, targetPayloadBytes, overlapSeconds);

    if (ranges.length <= 1) {
      return {
        chunks: [{ file, index: 0, total: 1, startSecond: 0, endSecond: durationInSeconds }],
        durationInSeconds,
        split: false,
      };
    }

    const chunks: TranscriptionFileChunk[] = [];
    const sourceBitrateKbps = Math.max(16, Math.ceil((file.size * 8) / (1024 * durationInSeconds)));
    const targetBitrateKbps = Math.max(24, Math.min(
      sourceBitrateKbps,
      Math.floor((targetPayloadBytes * 8 * 0.85) / (1024 * Math.max(1, ranges[0].endSecond - ranges[0].startSecond)))
    ));

    for (let index = 0; index < ranges.length; index += 1) {
      const range = ranges[index];
      const outputName = `chunk-${index}.m4a`;
      const duration = Math.max(0.25, range.endSecond - range.startSecond);

      await ffmpeg.exec([
        "-ss", String(range.startSecond),
        "-t", String(duration),
        "-i", inputName,
        ...(isVideoFile(file) ? ["-vn"] : []),
        "-ac", "1",
        "-c:a", "aac",
        "-b:a", `${targetBitrateKbps}k`,
        "-movflags", "+faststart",
        outputName,
      ]);

      const output = fileDataToUint8Array(await ffmpeg.readFile(outputName));
      await ffmpeg.deleteFile(outputName).catch(() => undefined);

      if (output.byteLength > targetPayloadBytes) {
        throw new Error(`Split chunk is larger than the safe request payload limit (${output.byteLength} > ${targetPayloadBytes})`);
      }

      chunks.push({
        file: new File(
          [toArrayBuffer(output)],
          `${baseName}.part-${String(index + 1).padStart(3, "0")}-of-${String(ranges.length).padStart(3, "0")}.m4a`,
          { type: "audio/mp4" }
        ),
        index,
        total: ranges.length,
        startSecond: range.startSecond,
        endSecond: range.endSecond,
      });
    }

    return {
      chunks,
      durationInSeconds,
      split: true,
    };
  } finally {
    await ffmpeg.deleteFile(inputName).catch(() => undefined);
  }
};

export const splitTranscriptionFile = async (
  file: File,
  options: TranscriptionFileSplitOptions
): Promise<TranscriptionFileSplitResult> => {
  const maxChunkSizeMb = Math.max(1, options.maxChunkSizeMb ?? 25);
  const maxChunkSizeBytes = maxChunkSizeMb * MB;

  if (!options.enabled || file.size <= maxChunkSizeBytes) {
    return {
      chunks: [{ file, index: 0, total: 1, startSecond: 0, endSecond: 0 }],
      split: false,
    };
  }

  return splitWithFfmpeg(file, maxChunkSizeBytes, options.overlapSeconds ?? 0);
};
