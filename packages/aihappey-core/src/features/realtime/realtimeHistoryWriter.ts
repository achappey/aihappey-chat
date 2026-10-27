import type { UIMessage } from 'aihappey-types';

/** Ordered, retryable writes through the ordinary conversation store, never a parallel history format. */
export class RealtimeHistoryWriter {
  private latest = new Map<string, UIMessage>();
  private saved = new Map<string, UIMessage>();
  private persisted = new Set<string>();
  private tail = Promise.resolve();
  constructor(private store: { add: (message: UIMessage) => Promise<void>; update: (message: UIMessage) => Promise<void>; error: (error: unknown) => void }) {}
  seed(messages: UIMessage[]) {
    for (const message of messages) {
      this.persisted.add(message.id);
      if (!this.latest.has(message.id)) { this.latest.set(message.id, message); this.saved.set(message.id, message); }
    }
  }
  remember(message: UIMessage) {
    const snapshot = structuredClone(message);
    this.latest.set(message.id, snapshot);
    return snapshot;
  }
  save(message: UIMessage) { return this.enqueue(this.remember(message)); }
  private enqueue(message: UIMessage) {
    this.tail = this.tail.then(async () => {
      try {
        if (this.persisted.has(message.id)) await this.store.update(message);
        else { await this.store.add(message); this.persisted.add(message.id); }
        this.saved.set(message.id, message);
      } catch (error) { this.store.error(error); }
    });
    return this.tail;
  }
  async flush() {
    await this.tail;
    // Retry dirty snapshots once, including drafts that never received a turn-done event.
    for (const [id, message] of this.latest) if (this.saved.get(id) !== message) this.enqueue(message);
    await this.tail;
    if ([...this.latest].some(([id, message]) => this.saved.get(id) !== message))
      throw new Error('The realtime conversation could not be completely saved. Retry Stop to save it before leaving.');
  }
  lastAssistant() { return [...this.latest.values()].reverse().find(message => message.role === 'assistant' && message.parts.length > 0); }
}
