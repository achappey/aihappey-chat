// audioSource.ts
/** detect Google-style PCM (LINEAR16) data URI */
export const isPcmDataUri = (audio?: string) =>
  typeof audio === "string" &&
  audio.startsWith("data:audio/L16;codec=pcm");

/** PCM (LINEAR16) → WAV blob URL */
export const pcmDataUriToWavUrl = (dataUri: string): string => {
  const match = dataUri.match(
    /^data:audio\/L16;codec=pcm;rate=(\d+);base64,(.+)$/
  );
  if (!match) throw new Error("Invalid PCM data URI");

  const sampleRate = Number(match[1]);
  const base64 = match[2];

  const pcmBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
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
  view.setUint16(o, 1, true); o += 2;   // PCM
  view.setUint16(o, 1, true); o += 2;   // mono
  view.setUint32(o, sampleRate, true); o += 4;
  view.setUint32(o, sampleRate * 2, true); o += 4;
  view.setUint16(o, 2, true); o += 2;   // block align
  view.setUint16(o, 16, true); o += 2;  // bits
  write("data");
  view.setUint32(o, pcmBytes.length, true); o += 4;

  new Uint8Array(wavBuffer, 44).set(pcmBytes);

  return URL.createObjectURL(new Blob([wavBuffer], { type: "audio/wav" }));
};

/**
 * Normalize any audio input into a playable URL.
 * Returns `{ src, revoke? }`
 */
export const normalizeAudioSource = (
  audio?: string
): { src?: string; revoke?: () => void } => {
  if (!audio || typeof audio !== "string") return {};

  if (isPcmDataUri(audio)) {
    const wavUrl = pcmDataUriToWavUrl(audio);
    return { src: wavUrl, revoke: () => URL.revokeObjectURL(wavUrl) };
  }

  // mp3 / wav / ogg / blob / http / normal data URI
  return { src: audio };
};
