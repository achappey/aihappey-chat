import {
  concatUint8Arrays,
  getOpenAISpeechFormatInfo,
  pcm16ToWav,
  type OpenAISpeechFormat,
} from "aihappey-ai";

export type StreamingAudioPlayback = {
  analyser?: AnalyserNode;
  append: (chunk: Uint8Array) => void;
  finish: (allChunks: Uint8Array[]) => Promise<void>;
  dispose: () => void;
};

export const createStreamingAudioPlayback = (
  format: OpenAISpeechFormat,
  audio: HTMLAudioElement,
): StreamingAudioPlayback => {
  const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
  const context: AudioContext | undefined = AudioContextCtor ? new AudioContextCtor() : undefined;
  const analyser = context?.createAnalyser();
  let objectUrl: string | undefined;
  let mediaSource: MediaSource | undefined;
  let sourceBuffer: SourceBuffer | undefined;
  let mediaElementSource: MediaElementAudioSourceNode | undefined;
  let queued: Uint8Array[] = [];
  let nextPcmStart = context?.currentTime ?? 0;
  let disposed = false;

  const connectAudioElement = () => {
    if (!context || !analyser || mediaElementSource) return;
    mediaElementSource = context.createMediaElementSource(audio);
    mediaElementSource.connect(analyser);
    analyser.connect(context.destination);
  };

  const flushMediaSource = () => {
    if (!sourceBuffer || sourceBuffer.updating || queued.length === 0 || disposed) return;
    const next = queued.shift()!;
    sourceBuffer.appendBuffer(next.slice().buffer);
  };

  if (format !== "pcm" && typeof MediaSource !== "undefined") {
    const mimeType = getOpenAISpeechFormatInfo(format).mimeType;
    if (MediaSource.isTypeSupported(mimeType)) {
      mediaSource = new MediaSource();
      objectUrl = URL.createObjectURL(mediaSource);
      audio.src = objectUrl;
      connectAudioElement();
      mediaSource.addEventListener("sourceopen", () => {
        if (!mediaSource || disposed) return;
        sourceBuffer = mediaSource.addSourceBuffer(mimeType);
        sourceBuffer.mode = "sequence";
        sourceBuffer.addEventListener("updateend", flushMediaSource);
        flushMediaSource();
        void context?.resume();
        void audio.play().catch(() => undefined);
      }, { once: true });
    }
  }

  void context?.resume();

  return {
    analyser,
    append: (chunk) => {
      if (disposed) return;
      if (format === "pcm" && context && analyser) {
        const sampleCount = Math.floor(chunk.byteLength / 2);
        const buffer = context.createBuffer(1, sampleCount, 24_000);
        const channel = buffer.getChannelData(0);
        const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
        for (let index = 0; index < sampleCount; index += 1) {
          channel[index] = view.getInt16(index * 2, true) / 32768;
        }
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(analyser);
        analyser.connect(context.destination);
        nextPcmStart = Math.max(nextPcmStart, context.currentTime + 0.02);
        source.start(nextPcmStart);
        nextPcmStart += buffer.duration;
        return;
      }
      if (mediaSource) {
        queued.push(chunk);
        flushMediaSource();
      }
    },
    finish: async (allChunks) => {
      if (disposed) return;
      // PCM chunks have already been scheduled directly through Web Audio.
      // The page creates a separate WAV object URL for its themed final player.
      if (format === "pcm" && context) return;
      if (mediaSource && sourceBuffer) {
        const closeWhenReady = () => {
          if (!mediaSource || mediaSource.readyState !== "open") return;
          if (sourceBuffer?.updating || queued.length) {
            window.setTimeout(closeWhenReady, 25);
            return;
          }
          mediaSource.endOfStream();
        };
        closeWhenReady();
        return;
      }

      const bytes = concatUint8Arrays(allChunks);
      const playableBytes = format === "pcm" ? pcm16ToWav(bytes) : bytes;
      const mimeType = format === "pcm" ? "audio/wav" : getOpenAISpeechFormatInfo(format).mimeType;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(new Blob([playableBytes as BlobPart], { type: mimeType }));
      audio.src = objectUrl;
      if (format !== "pcm") connectAudioElement();
      await context?.resume();
      await audio.play().catch(() => undefined);
    },
    dispose: () => {
      disposed = true;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      void context?.close();
      queued = [];
    },
  };
};
