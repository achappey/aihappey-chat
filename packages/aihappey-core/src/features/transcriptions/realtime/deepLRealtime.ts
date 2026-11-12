import type { RealtimeResponse } from "aihappey-ai";

export const deepLTargetLanguage = (model: string): string | undefined => {
  if (model === "deepl/voice-realtime") return undefined;
  const match = /^deepl\/voice-realtime\/translate-to\/([a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*)$/.exec(model);
  if (!match) throw new Error("Select a DeepL Voice realtime transcription model.");
  return match[1];
};

export function deepLConnection(token: RealtimeResponse): string {
  const address = token.providerMetadata?.deepl?.streaming_url;
  if (typeof address !== "string" || !token.value || !Number.isFinite(token.expires_at) || token.expires_at * 1000 <= Date.now())
    throw new Error("DeepL returned an invalid or expired session credential.");
  let url: URL;
  try { url = new URL(address); } catch { throw new Error("DeepL returned an invalid streaming address."); }
  if (url.protocol !== "wss:" || (url.port && url.port !== "443") || url.username || url.password || url.hash
    || !(url.hostname === "api.deepl.com" || url.hostname.endsWith(".deepl.com")))
    throw new Error("DeepL returned an invalid streaming address.");
  url.searchParams.set("token", token.value);
  return url.toString();
}

export type DeepLSegment = { text: string; start_time: number; end_time: number; language?: string };
export type DeepLTranscriptEvent = { type: "deepl.transcript"; language?: string; concluded: DeepLSegment[]; tentative: DeepLSegment[] };

/** Select exactly one output stream. Source and target timings need not align. */
export function deepLTranscriptEvent(message: any, target?: string): DeepLTranscriptEvent | undefined {
  const update = target ? message.target_transcript_update : message.source_transcript_update;
  if (!update || (target && String(update.language).toLowerCase() !== target.toLowerCase())) return;
  const segments = (value: unknown): DeepLSegment[] => {
    if (!Array.isArray(value) || value.length > 100_000) throw new Error("Invalid DeepL transcript segments.");
    return value.map(segment => {
      if (typeof segment?.text !== "string" || segment.text.length > 2_000_000
        || !Number.isInteger(segment.start_time) || !Number.isInteger(segment.end_time)
        || segment.start_time < 0 || segment.end_time < segment.start_time) throw new Error("Invalid DeepL transcript segment.");
      return { text: segment.text, start_time: segment.start_time, end_time: segment.end_time,
        ...(typeof segment.language === "string" ? { language: segment.language } : {}) };
    });
  };
  return { type: "deepl.transcript", language: target ?? update.concluded?.[0]?.language ?? update.tentative?.[0]?.language,
    concluded: segments(update.concluded), tentative: segments(update.tentative) };
}

/** Concluded segments append once; each tentative array replaces the entire draft. */
export class DeepLTranscript {
  private concluded: DeepLSegment[] = [];
  private tentative: DeepLSegment[] = [];
  private seen = new Set<string>();
  language?: string;
  apply(event: DeepLTranscriptEvent) {
    for (const segment of event.concluded) {
      const key = JSON.stringify([segment.start_time, segment.end_time, segment.language, segment.text]);
      if (!this.seen.has(key)) { this.seen.add(key); this.concluded.push(segment); }
    }
    this.tentative = event.tentative;
    this.language = event.language ?? this.language;
    if (this.concluded.length > 100_000 || this.snapshot().displayText.length > 2_000_000) throw new Error("DeepL transcript limit exceeded.");
  }
  snapshot() {
    const text = this.concluded.map(segment => segment.text).join("");
    return { text, displayText: text + this.tentative.map(segment => segment.text).join(""), language: this.language,
      segments: this.concluded.map(segment => ({ text: segment.text, startSecond: segment.start_time / 1000, endSecond: segment.end_time / 1000 })),
      durationInSeconds: this.concluded.length ? Math.max(...this.concluded.map(segment => segment.end_time)) / 1000 : undefined };
  }
}
