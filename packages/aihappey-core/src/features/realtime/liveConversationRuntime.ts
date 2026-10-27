import type { UIMessage } from 'aihappey-types';

export type LiveRuntimeCallbacks = {
  send: (event: any) => void;
  message: (message: UIMessage) => void;
  error: (message: string) => void;
  execute: (item: any, signal: AbortSignal) => Promise<any>;
  runClient: (messages: UIMessage[], signal: AbortSignal) => Promise<string>;
  closed: (event: any) => void;
};

/** Session-owned protocol state. Nothing in this class knows a client agent/model selection. */
export class LiveConversationRuntime {
  private lifetime = new AbortController();
  private seen = new Set<string>();
  private calls = new Set<string>();
  private responses = new Map<string, { pending: Promise<void>[]; continued: boolean; complete: boolean }>();
  private responseByDelegation = new Map<string, string>();
  private timeline: { message: UIMessage; end: number }[] = [];
  private draft?: UIMessage;
  private revision = 0;
  private queue = Promise.resolve();
  private mode: 'client' | 'responses';
  private stopped = false;
  constructor(private callbacks: LiveRuntimeCallbacks, mode: 'client' | 'responses', initial: UIMessage[] = []) {
    this.mode = mode;
    this.timeline = initial.map(message => ({ message, end: 0 }));
  }
  private send(type: string, fields: Record<string, any> = {}) {
    if (!this.stopped) this.callbacks.send({ type, event_id: crypto.randomUUID(), ...fields });
  }
  private append(channel: 'thinking' | 'commentary', text: string, delegationId: string | null) {
    // A byte is an upper bound on token count. Keep each append below the 500-token limit
    // without an extra inference call or a provider-specific tokenizer dependency.
    let content = '';
    for (const character of text) {
      if (new TextEncoder().encode(content + character).length > 450) {
        this.send(`session.${channel}.append`, { content, delegation_id: delegationId }); content = '';
      }
      content += character;
    }
    this.send(`session.${channel}.append`, { content, delegation_id: delegationId });
  }
  sendMessage(message: UIMessage) {
    this.revision++;
    this.timeline.push({ message, end: Number.MAX_SAFE_INTEGER });
    if (this.mode === 'responses') {
      const content = message.parts.flatMap((part: any): any[] => part.type === 'text' ? [{ type: 'input_text', text: part.text }]
        : part.type === 'file' && part.mediaType?.startsWith('image/') ? [{ type: 'input_image', image_url: part.url, detail: 'auto' }]
        : part.type === 'file' ? [{ type: 'input_file', file_url: part.url, filename: part.filename }] : []);
      if (!content.length) throw new Error('No supported backend input was supplied.');
      this.send('response.item.create', { item: { type: 'message', role: 'user', content } });
      this.send('response.create');
    } else {
      // Typed input is user data for the selected backend, not developer instructions for Live.
      this.delegate(null, Number.MAX_SAFE_INTEGER);
    }
  }
  handle(event: any) {
    if (this.stopped && event.type !== 'session.closed') return;
    if (event.event_id) {
      if (this.seen.has(event.event_id)) return;
      if (this.seen.size >= 20000) { this.callbacks.error('Live event limit reached; restart the session.'); this.stop(); return; }
      this.seen.add(event.event_id);
    }
    if (event.type === 'session.started') {
      const mode = event.session?.delegation?.type ?? 'client';
      if (mode === 'client' || mode === 'responses') this.mode = mode;
    } else if (event.type === 'session.input_transcript.delta' || event.type === 'session.output_transcript.delta') {
      if (typeof event.delta !== 'string' || !Number.isFinite(event.start_ms) || !Number.isFinite(event.end_ms) || event.end_ms < event.start_ms) return;
      const role = event.type === 'session.input_transcript.delta' ? 'user' : 'assistant';
      if (role === 'user') this.revision++;
      if (!this.draft || this.draft.role !== role) {
        this.draft = { id: crypto.randomUUID(), role, parts: [{ type: 'text', text: '' }], metadata: { realtime: true, start_ms: event.start_ms } };
      }
      const text = String((this.draft.parts[0] as any).text) + event.delta;
      this.draft = { ...this.draft, parts: [{ type: 'text', text }], metadata: { ...this.draft.metadata, end_ms: event.end_ms } };
      const index = this.timeline.findIndex(entry => entry.message.id === this.draft!.id);
      const entry = { message: this.draft, end: event.end_ms };
      if (index < 0) this.timeline.push(entry); else this.timeline[index] = entry;
      if (this.timeline.length > 1000) this.timeline.shift();
      this.callbacks.message(this.draft);
    } else if (event.type === 'session.delegation.created') {
      const id = event.delegation?.id;
      if (!id || this.calls.has('delegation:' + id)) return;
      this.calls.add('delegation:' + id);
      if (event.delegation.target === 'client' && this.mode === 'client') this.delegate(id, event.offset_ms);
      if (event.delegation.response_id) this.responseByDelegation.set(id, event.delegation.response_id);
    } else if (event.type === 'response.event' && this.mode === 'responses') {
      this.responseEvent(event);
    } else if (event.type === 'error') {
      this.callbacks.error(event.error?.message ?? 'Live command failed.');
    } else if (event.type === 'session.closed') {
      this.callbacks.closed(event); this.stop();
    }
  }
  private delegate(id: string | null, offset: number) {
    const revision = this.revision;
    const snapshot = structuredClone(this.timeline.filter(entry => entry.end <= offset || entry.end === Number.MAX_SAFE_INTEGER).map(entry => entry.message));
    this.append('thinking', '', id);
    this.queue = this.queue.catch(() => undefined).then(async () => {
      if (this.stopped || revision !== this.revision) return;
      try {
        const result = await this.callbacks.runClient(snapshot, this.lifetime.signal);
        if (!this.stopped && revision === this.revision) this.append('commentary', result, id);
      } catch (error) {
        if (!this.stopped && revision === this.revision) {
          this.callbacks.error(error instanceof Error ? error.message : 'Client delegation failed.');
          this.append('commentary', 'The requested operation could not be verified. No successful outcome is confirmed.', id);
        }
      }
    });
  }
  private responseEvent(envelope: any) {
    const event = envelope.event;
    if (!event || typeof event.type !== 'string') return;
    if (event.type === 'response.created') this.responseByDelegation.set(envelope.delegation_id ?? '', event.response.id);
    const responseId = event.response?.id ?? event.response_id ?? this.responseByDelegation.get(envelope.delegation_id ?? '');
    if (!responseId) return;
    let state = this.responses.get(responseId);
    if (!state) { state = { pending: [], continued: false, complete: false }; this.responses.set(responseId, state); }
    if (event.type === 'response.output_item.done') {
      const item = event.item;
      const resultTypes: Record<string, string> = { function_call: 'function_call_output', custom_tool_call: 'custom_tool_call_output', computer_call: 'computer_call_output', shell_call: 'shell_call_output', apply_patch_call: 'apply_patch_call_output', tool_search_call: 'tool_search_output', mcp_approval_request: 'mcp_approval_response' };
      if (!item || !resultTypes[item.type] || (item.type === 'tool_search_call' && item.execution !== 'client') || (item.type === 'shell_call' && item.environment?.type !== 'local')) return;
      const key = responseId + ':' + (item.call_id ?? item.id);
      if (this.calls.has(key)) return;
      this.calls.add(key);
      state.pending.push((async () => {
        const result = await this.callbacks.execute(item, this.lifetime.signal);
        if (!this.stopped) this.send('response.item.create', { item: result });
      })());
      void this.continue(responseId, state);
    } else if (event.type === 'response.completed') {
      state.complete = true; void this.continue(responseId, state);
    } else if (event.type === 'response.failed' || event.type === 'response.incomplete') {
      this.callbacks.error(event.response?.error?.message ?? 'The delegated response did not complete.');
    }
  }
  private async continue(id: string, state: { pending: Promise<void>[]; continued: boolean; complete: boolean }) {
    if (!state.complete || !state.pending.length || state.continued) return;
    state.continued = true;
    try {
      await Promise.all(state.pending);
      if (!this.stopped) this.send('response.create');
    } catch (error) { if (!this.stopped) this.callbacks.error(error instanceof Error ? error.message : 'Tool result failed.'); }
  }
  stop() { this.stopped = true; this.lifetime.abort(); this.responses.clear(); this.responseByDelegation.clear(); }
}
