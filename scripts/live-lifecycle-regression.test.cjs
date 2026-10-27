const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = 'packages/aihappey-core/src/features/realtime/';
function load(file) {
  const module = { exports: {} };
  const source = fs.readFileSync(path.resolve(__dirname, '..', root, file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'module', 'exports', code)(id => { throw new Error('Unexpected runtime dependency: ' + id); }, module, module.exports);
  return module.exports;
}
const { RealtimeHistoryWriter } = load('realtimeHistoryWriter.ts');
const { LiveConversationRuntime } = load('liveConversationRuntime.ts');
const { completeLiveToolCalls } = load('completeLiveToolCalls.ts');
const { buildLiveSessionConfig } = load('liveSessionConfig.ts');

test('ordered ordinary UI-part history preserves final fragments and full tool results before navigation', async () => {
  const saved = new Map(), operations = [];
  const writer = new RealtimeHistoryWriter({
    async add(message) { await new Promise(resolve => setTimeout(resolve, 2)); operations.push('add:' + message.id); saved.set(message.id, message); },
    async update(message) { operations.push('update:' + message.id); assert(saved.has(message.id)); saved.set(message.id, message); }, error(error) { throw error; },
  });
  const first = { id: 'speech', role: 'assistant', parts: [{ type: 'text', text: 'Hello' }] };
  writer.save(first); writer.save({ ...first, parts: [{ type: 'text', text: 'Hello there.' }] });
  const tool = { id: 'tool', role: 'assistant', parts: [{ type: 'tool-lookup', toolCallId: 'call', input: { name: 'Hungary' }, output: { content: [{ type: 'text', text: 'HU' }], structuredContent: { cca: 'HU' } }, state: 'approval-responded', approval: { id: 'review', approved: true } }] };
  writer.remember(tool);
  await writer.flush(); operations.push('navigate');
  assert.deepEqual(operations, ['add:speech', 'update:speech', 'add:tool', 'navigate']);
  assert.equal(saved.get('speech').parts[0].text, 'Hello there.');
  assert.deepEqual(JSON.parse(JSON.stringify(saved.get('tool'))), tool);
});

test('failed history writes block navigation and can be retried without replaying inference', async () => {
  let unavailable = true, navigated = false;
  const writer = new RealtimeHistoryWriter({ add: async () => { if (unavailable) throw Error('offline'); }, update: async () => {}, error() {} });
  await writer.save({ id: 'user', role: 'user', parts: [{ type: 'text', text: 'Keep this' }] });
  await assert.rejects(async () => { await writer.flush(); navigated = true; }, /completely saved/);
  assert.equal(navigated, false);
  unavailable = false; await writer.flush();
});

test('beginClose cancels delegation but still accepts final transcript and terminal metadata', () => {
  const messages = [], terminal = [], sends = [];
  const runtime = new LiveConversationRuntime({ send: event => sends.push(event), message: message => messages.push(message), closed: event => terminal.push(event), error() {}, execute: async () => {}, runClient: async () => '' }, 'client');
  runtime.handle({ type: 'session.output_transcript.delta', delta: 'First', start_ms: 0, end_ms: 10 });
  runtime.beginClose();
  runtime.handle({ type: 'session.output_transcript.delta', delta: ' final.', start_ms: 10, end_ms: 20 });
  runtime.handle({ type: 'session.delegation.created', delegation: { id: 'late', target: 'client' }, offset_ms: 20 });
  runtime.handle({ type: 'session.closed', usage: { seconds: 5 }, reason: 'close_requested' });
  assert.equal(messages.at(-1).parts[0].text, 'First final.');
  assert.equal(terminal[0].usage.seconds, 5); assert.deepEqual(sends, []);
});

test('approval-requested client calls execute once and retain the actual output before decision/continuation', async () => {
  const events = [], output = { content: [{ type: 'text', text: 'HU' }], structuredContent: { name: 'Hungary' } };
  const chat = { messages: [{ id: 'reply', role: 'assistant', parts: [{ type: 'tool-search', toolCallId: 'fc_123', input: { name: 'Hungary' }, state: 'approval-requested', approval: { id: 'approval' } }] }],
    addToolOutput() { throw Error('Do not erase an unresponded approval.'); },
    addToolApprovalResponse(decision) { events.push('decision'); const part = this.messages[0].parts[0]; assert.deepEqual(part.output, output); part.state = 'approval-responded'; part.approval = { ...part.approval, ...decision }; },
  };
  const executed = new Map();
  const args = { chat, executed, signal: new AbortController().signal, execute: async () => { events.push('execute'); return output; }, review: async review => { events.push('review'); assert.deepEqual(review.output, output); return { approved: true }; } };
  assert.equal(await completeLiveToolCalls(args), true);
  assert.equal(await completeLiveToolCalls(args), false);
  assert.deepEqual(events, ['execute', 'review', 'decision']);
});

test('precomputed outputs are not executed again and denied content is not released', async () => {
  const chat = { messages: [{ id: 'reply', parts: [{ type: 'tool-search', toolCallId: 'call', input: {}, output: { secret: 'private result' }, state: 'approval-requested', approval: { id: 'a' } }] }],
    addToolOutput() {}, addToolApprovalResponse() {},
  };
  await completeLiveToolCalls({ chat, executed: new Map(), signal: new AbortController().signal,
    execute: async () => { throw Error('Already executed'); }, review: async () => ({ approved: false, reason: 'Not released' }),
  });
  assert(!JSON.stringify(chat.messages).includes('private result'));
  assert.match(JSON.stringify(chat.messages), /Not released/);
});

test('saved raw options cannot enable provider session storage or leak legacy VAD/client selection', () => {
  const config = buildLiveSessionConfig({ session: { store: true, type: 'realtime', audio: { input: { turn_detection: { type: 'semantic_vad' } } }, delegation: { type: 'client' } }, liveClientTarget: 'private-agent' }, 'hello');
  assert.equal(config.providerOptions.openai.session.store, false);
  assert(!JSON.stringify(config).includes('semantic_vad')); assert(!JSON.stringify(config).includes('private-agent'));
});

test('intentional gateway WebRTC Stop is idempotent and ignores expected teardown errors', async () => {
  const originalPeer = global.RTCPeerConnection, originalNavigator = Object.getOwnPropertyDescriptor(global, 'navigator');
  const errors = [], received = []; let peer, trackStops = 0;
  const stream = { getAudioTracks: () => [{ stop() { trackStops++; } }], getTracks: () => [{ stop() { trackStops++; } }] };
  class Peer {
    constructor() { peer = this; this.connectionState = 'connected'; this.sctp = { maxMessageSize: 65536 }; }
    createDataChannel() { return this.dc = { readyState: 'open', bufferedAmount: 0, send: json => {
      if (JSON.parse(json).type === 'session.close') queueMicrotask(() => {
        this.dc.onerror?.({ isTrusted: true });
        this.dc.onmessage?.({ data: JSON.stringify({ type: 'session.output_transcript.delta', delta: 'Final', start_ms: 0, end_ms: 1 }) });
        this.dc.onmessage?.({ data: JSON.stringify({ type: 'session.closed', usage: { seconds: 1 }, reason: 'close_requested' }) });
      });
    }, close() { this.readyState = 'closed'; this.onclose?.(); } }; }
    addTrack() {} async createOffer() { return { sdp: 'offer' }; }
    async setLocalDescription(offer) { this.localDescription = offer; }
    async setRemoteDescription() {} close() { this.connectionState = 'closed'; this.onconnectionstatechange?.(); }
  }
  global.RTCPeerConnection = Peer;
  Object.defineProperty(global, 'navigator', { configurable: true, value: { mediaDevices: { getUserMedia: async () => stream } } });
  try {
    const { startGatewayRealtimeWebrtc } = load('startGatewayRealtimeWebrtc.ts');
    const session = await startGatewayRealtimeWebrtc({ model: { capabilities: { conversation: 'continuous' }, parseServerEvent: raw => raw, doCreateWebRTCSession: async () => ({ sessionId: 'id', sdp: 'answer' }) }, events: { onError: message => errors.push(message), onEvent: event => received.push(event) } });
    peer.dc.onerror({ isTrusted: true }); assert.equal(errors.length, 1); errors.length = 0;
    const first = session.stop(), second = session.stop(); assert.equal(first, second); await first;
    assert.deepEqual(errors, []); assert.equal(received.at(-1).type, 'session.closed'); assert.equal(trackStops, 1);
    await session.stop(); assert.equal(trackStops, 1);
  } finally { global.RTCPeerConnection = originalPeer; if (originalNavigator) Object.defineProperty(global, 'navigator', originalNavigator); else delete global.navigator; }
});
