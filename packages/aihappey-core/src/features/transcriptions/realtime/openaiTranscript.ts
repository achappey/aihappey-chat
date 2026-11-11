type TranscriptItem = {
  id: string;
  connection: number;
  previousId?: string | null;
  partial: string;
  text?: string;
  startMs?: number;
  endMs?: number;
};

const timestamp = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;

/** OpenAI finals replace drafts per item; completion arrival order is not speech order. */
export class OpenAiTranscript {
  private readonly items = new Map<string, TranscriptItem>();
  private connection = 0;
  private offsetMs = 0;

  apply(event: any): boolean {
    if (event?.type === "aihappey.transcription.connection") {
      this.connection = event.connection;
      this.offsetMs = timestamp(event.offset_ms) ?? 0;
      // An unconfirmed draft belongs to its old connection, not the next one.
      for (const item of this.items.values()) if (item.text === undefined) item.partial = "";
      return true;
    }
    const rawId = event?.item_id;
    if (typeof rawId !== "string" || !rawId) return false;
    const id = `${this.connection}:${rawId}`;
    const type = event?.type;
    if (!["input_audio_buffer.committed", "input_audio_buffer.speech_started", "input_audio_buffer.speech_stopped",
      "conversation.item.input_audio_transcription.delta", "conversation.item.input_audio_transcription.completed"].includes(type)) return false;
    const item = this.items.get(id) ?? { id, connection: this.connection, partial: "" };
    this.items.set(id, item);
    if (type === "input_audio_buffer.committed") {
      if (event.previous_item_id === null) item.previousId = null;
      else if (typeof event.previous_item_id === "string") item.previousId = `${this.connection}:${event.previous_item_id}`;
    } else if (type === "input_audio_buffer.speech_started") {
      const time = timestamp(event.audio_start_ms);
      if (time !== undefined) item.startMs = this.offsetMs + time;
    } else if (type === "input_audio_buffer.speech_stopped") {
      const time = timestamp(event.audio_end_ms);
      if (time !== undefined) item.endMs = this.offsetMs + time;
    } else if (type === "conversation.item.input_audio_transcription.delta") {
      if (item.text === undefined && typeof event.delta === "string") item.partial += event.delta;
    } else if (typeof event.transcript === "string") {
      item.text = event.transcript;
      item.partial = "";
    }
    return true;
  }

  snapshot() {
    const byTime = [...this.items.values()].sort((a, b) => a.connection - b.connection
      || (a.startMs ?? Number.MAX_SAFE_INTEGER) - (b.startMs ?? Number.MAX_SAFE_INTEGER));
    const ordered: TranscriptItem[] = [];
    const visited = new Set<string>();
    for (const item of byTime) {
      const chain: TranscriptItem[] = [];
      let current: TranscriptItem | undefined = item;
      // Iterative traversal handles long sessions and malformed cyclic predecessor links.
      while (current && !visited.has(current.id)) {
        visited.add(current.id);
        chain.push(current);
        current = current.previousId ? this.items.get(current.previousId) : undefined;
      }
      for (const before of chain.reverse()) ordered.push(before);
    }
    const text = ordered.map(item => item.text?.trim()).filter(Boolean).join(" ");
    const displayText = ordered.map(item => (item.text ?? item.partial).trim()).filter(Boolean).join(" ");
    // Missing VAD timings must not discard confirmed text or invent accurate timestamps.
    const segments = ordered.filter(item => item.text !== undefined && item.startMs !== undefined && item.endMs !== undefined)
      .map(item => ({ text: item.text!.trim(), startSecond: item.startMs! / 1000, endSecond: Math.max(item.startMs!, item.endMs!) / 1000 }));
    return { text, displayText, segments,
      durationInSeconds: segments.length ? Math.max(...segments.map(segment => segment.endSecond)) : undefined };
  }
}
