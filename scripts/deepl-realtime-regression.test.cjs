const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { renderer } = require('./react-test-renderer.cjs');
const root = path.resolve(__dirname, '../packages/aihappey-core/src/features');
function load(file, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'module', 'exports', code)(id => {
    if (id in mocks) return mocks[id];
    if (id.startsWith('.')) return load(path.resolve(path.dirname(file), id + '.ts'), mocks);
    throw new Error('Unexpected dependency ' + id);
  }, module, module.exports);
  return module.exports;
}
const protocol = load(path.join(root, 'transcriptions/realtime/deepLRealtime.ts'));
const segment = (text, start_time = 0, end_time = 100) => ({ text, start_time, end_time });
const update = (concluded = [], tentative = [], language = 'nl') => ({ type: 'deepl.transcript', language, concluded, tentative });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

test('DeepL models select one stream, including language variants; default ignores target text', () => {
  assert.equal(protocol.deepLTargetLanguage('deepl/voice-realtime'), undefined);
  assert.equal(protocol.deepLTargetLanguage('deepl/voice-realtime/translate-to/en-US'), 'en-US');
  assert.throws(() => protocol.deepLTargetLanguage('deepl/translate-to/DE'));
  const message = { source_transcript_update: { concluded: [{ ...segment('Hello'), language: 'en' }], tentative: [] },
    target_transcript_update: { language: 'nl', concluded: [segment('Hallo')], tentative: [] } };
  assert.equal(protocol.deepLTranscriptEvent(message).concluded[0].text, 'Hello');
  assert.equal(protocol.deepLTranscriptEvent(message, 'nl').concluded[0].text, 'Hallo');
  assert.equal(protocol.deepLTranscriptEvent(message, 'de'), undefined);
  assert.equal(protocol.deepLTranscriptEvent({ source_transcript_update: message.source_transcript_update }, 'nl'), undefined);
});

test('DeepL preserves punctuation, whitespace and CJK; drafts replace and never enter confirmed snapshots', () => {
  const transcript = new protocol.DeepLTranscript();
  transcript.apply(update([segment('你好')], [segment(' 错', 100, 200)]));
  transcript.apply(update([], [segment('世界', 100, 200)]));
  assert.equal(transcript.snapshot().text, '你好'); assert.equal(transcript.snapshot().displayText, '你好世界');
  transcript.apply(update([segment('世界', 100, 200), segment('。\n', 200, 250)], []));
  transcript.apply(update([segment('世界', 100, 200)], []));
  assert.equal(transcript.snapshot().text, '你好世界。\n');
  assert.equal(transcript.snapshot().segments.length, 3);
  assert.equal(transcript.snapshot().durationInSeconds, .25);
  assert.throws(() => protocol.deepLTranscriptEvent({ source_transcript_update: { concluded: [segment('bad', 200, 100)], tentative: [] } }));
});

test('DeepL uses returned address, preserves routing query, replaces token and rejects unsafe hosts', () => {
  const token = { value: 'short+/token', expires_at: Date.now() / 1000 + 30,
    providerMetadata: { deepl: { streaming_url: 'wss://voice.deepl.com/region/current?route=2&token=old' } } };
  const url = new URL(protocol.deepLConnection(token));
  assert.equal(url.pathname, '/region/current'); assert.equal(url.searchParams.get('route'), '2');
  assert.deepEqual(url.searchParams.getAll('token'), ['short+/token']);
  for (const address of ['wss://evil.test', 'wss://deepl.com.evil.test', 'ws://api.deepl.com', 'wss://user@api.deepl.com', 'wss://api.deepl.com:444'])
    assert.throws(() => protocol.deepLConnection({ ...token, providerMetadata: { deepl: { streaming_url: address } } }));
});

test('DeepL chat waits for concluded text and silence; fragments form one exact turn without replay', async () => {
  const { AgentTranscriptionTurns } = load(path.join(root, 'realtime/agentTranscriptionTurns.ts'));
  const turns = [], previews = []; let starts = 0;
  const handler = new AgentTranscriptionTurns('deepl', { start: () => starts++, preview: value => previews.push(value), turn: value => turns.push(value) });
  handler.activity(true); assert.equal(starts, 0);
  handler.event(update([], [segment('Hallo')])); await pause(920); assert.deepEqual(turns, []);
  handler.event(update([segment('Hallo')], [segment(' wereld', 100, 200)]));
  handler.event(update([segment(' wereld', 100, 200)], []));
  handler.activity(false); await pause(930);
  assert.deepEqual(turns, ['Hallo wereld']);
  handler.event(update([segment(' wereld', 100, 200)], [])); await pause(930);
  assert.deepEqual(turns, ['Hallo wereld']); handler.dispose();
});

test('DeepL muted drafts and late conclusions cannot return as a new chat turn', async () => {
  const { AgentTranscriptionTurns } = load(path.join(root, 'realtime/agentTranscriptionTurns.ts'));
  const turns = [];
  const handler = new AgentTranscriptionTurns('deepl', { start() {}, preview() {}, turn: value => turns.push(value) });
  handler.event(update([], [segment('discard')])); handler.setMuted(true);
  handler.event(update([], [segment('discard late', 0, 200)])); handler.setMuted(false);
  handler.event(update([segment('discard late', 0, 200)], [])); await pause(930); assert.deepEqual(turns, []);
  handler.event(update([segment('New', 250, 350)], [])); await pause(930); assert.deepEqual(turns, ['New']); handler.dispose();
});

async function libraryHarness({ model = 'deepl/voice-realtime/translate-to/nl', stopError = false } = {}) {
  const view = renderer(); let controller, events, stopped = 0;
  const writes = [], deletes = [], alerts = [];
  const state = { customHeaders: {}, providerRealtimeMetadata: {}, setRealtimeSessionState(patch) { Object.assign(state, patch); }, resetRealtimeSessionState() {} };
  const mocks = { react: view.react, 'aihappey-state': { useAppStore: select => select(state) },
    'aihappey-i18n': { useTranslation: () => ({ t: value => value }) }, 'aihappey-ai': { getRealtimeToken: async () => async () => ({}) },
    '../../provider-credentials/scopedRequest': { buildOperationHeaders: async () => ({}) },
    './startRealtimeWebrtcSession': { startRealtimeWebrtcSession: async args => {
      events = args.events; events.onSessionCreated({ provider: 'deepl' });
      return { stop: async () => { stopped++; if (stopError) throw new Error('Finalization failed'); events.onEvent(update([segment(' wereld', 100, 200)], [])); } };
    } }, '../../realtime/googleLiveConfig': { buildGoogleLiveTokenPayload() {} },
    '../transcriptionErrors': { getTranscriptionErrorMessage: String } };
  const { useRealtimeTranscriptionController } = load(path.join(root, 'transcriptions/realtime/useRealtimeTranscriptionController.ts'), mocks);
  const args = { config: { baseUrl: 'https://gateway/', endpoints: { realtime: 'token' } },
    selectedModel: { id: model, tags: ['real-time'] }, onErrorAlert: value => alerts.push(value),
    transcriptions: { async add() { return { id: 'record' }; }, async update(id, patch) { writes.push(structuredClone(patch.transcription)); }, async delete(id) { deletes.push(id); } } };
  function Component() { controller = useRealtimeTranscriptionController(args); return null; }
  view.render(Component, {}); await controller.start();
  return { controller, events, state, writes, deletes, alerts, stopped: () => stopped, rerender: () => view.render(Component, {}) };
}

test('DeepL library persists confirmed translation, drains final output and never saves tentative preview or credentials', async () => {
  const { controller, events, state, writes, deletes, stopped, rerender } = await libraryHarness();
  events.onEvent(update([segment('Hallo')], [segment(' wrong draft', 100, 200)])); await pause(10);
  assert.equal(state.realtimeText, 'Hallo wrong draft'); assert.equal(writes.at(-1).text, 'Hallo');
  rerender(); await controller.stop(); await controller.stop();
  assert.equal(stopped(), 1); assert.equal(writes.at(-1).text, 'Hallo wereld');
  assert.equal(writes.at(-1).language, 'nl'); assert.equal(writes.at(-1).response.body.status, 'completed');
  assert.deepEqual(deletes, []); assert.ok(!JSON.stringify(writes).includes('wrong draft'));
});

test('DeepL finalization failure retains confirmed text as errored instead of promoting preview', async () => {
  const h = await libraryHarness({ stopError: true });
  h.events.onEvent(update([segment('Confirmed')], [segment(' draft', 100, 200)]));
  await h.controller.stop();
  assert.equal(h.writes.at(-1).text, 'Confirmed'); assert.equal(h.writes.at(-1).response.body.status, 'error');
  assert.equal(h.state.realtimeStatus, 'error'); assert.equal(h.state.realtimeText, 'Confirmed'); assert.deepEqual(h.deletes, []);
});

test('DeepL source-only model retains detected source language and fatal failure discards interim-only sessions', async () => {
  const source = await libraryHarness({ model: 'deepl/voice-realtime', stopError: true });
  source.events.onEvent(update([segment('Hello')], [segment(' draft', 100, 200)], 'en'));
  source.events.onError('Disconnected'); source.events.onError('duplicate'); await pause(30);
  assert.equal(source.writes.at(-1).text, 'Hello'); assert.equal(source.writes.at(-1).language, 'en');
  assert.equal(source.writes.at(-1).response.body.status, 'error'); assert.equal(source.stopped(), 1);
  const draft = await libraryHarness({ stopError: true });
  draft.events.onEvent(update([], [segment('only draft')])); draft.events.onError('Disconnected'); await pause(30);
  assert.deepEqual(draft.deletes, ['record']); assert.deepEqual(draft.writes, []);
});

test('DeepL cancellation before token completion never opens a socket or microphone', async () => {
  const { startDeepLRealtimeWsSession } = load(path.join(root, 'transcriptions/realtime/startDeepLRealtimeWsSession.ts'));
  let release;
  const token = new Promise(resolve => { release = resolve; }); const abort = new AbortController();
  const starting = startDeepLRealtimeWsSession({ modelId: 'deepl/voice-realtime', signal: abort.signal, getEphemeralToken: () => token });
  abort.abort(); release({}); await assert.rejects(starting, error => error.name === 'AbortError');
});

test('DeepL WebSocket sends paced PCM JSON and waits beyond end-of-transcript for end-of-stream', async () => {
  const previous = { WebSocket: global.WebSocket, AudioContext: global.AudioContext };
  const sockets = [], contexts = []; let trackStops = 0;
  class Socket {
    static OPEN = 1; readyState = 0; bufferedAmount = 0; handlers = {}; sent = [];
    constructor(url) { this.url = url; sockets.push(this); queueMicrotask(() => { this.readyState = 1; this.emit('open'); }); }
    addEventListener(type, fn) { (this.handlers[type] ??= []).push(fn); }
    emit(type, value) { for (const fn of this.handlers[type] ?? []) fn(value); }
    send(value) { this.sent.push({ value: JSON.parse(value), at: Date.now() }); }
    close() { this.readyState = 3; }
    message(value) { this.emit('message', { data: JSON.stringify(value) }); }
  }
  const node = () => ({ connect() {}, disconnect() {} });
  class Context {
    sampleRate = 16000; state = 'running'; destination = {}; processor;
    constructor() { contexts.push(this); }
    createMediaStreamSource() { return node(); } createGain() { return { ...node(), gain: {} }; }
    createScriptProcessor() { return this.processor = node(); } async resume() {} async close() { this.state = 'closed'; }
  }
  global.WebSocket = Socket; global.AudioContext = Context;
  try {
    const { startDeepLRealtimeWsSession } = load(path.join(root, 'transcriptions/realtime/startDeepLRealtimeWsSession.ts'));
    const events = [], errors = [];
    const session = await startDeepLRealtimeWsSession({ modelId: 'deepl/voice-realtime/translate-to/nl',
      microphoneStream: { getTracks: () => [{ stop: () => trackStops++ }] },
      getEphemeralToken: async () => ({ value: 'ephemeral', expires_at: Date.now() / 1000 + 60, providerMetadata: { deepl: { streaming_url: 'wss://voice.deepl.com/dynamic?route=2' } } }),
      events: { onEvent: value => events.push(value), onError: value => errors.push(value) } });
    const ws = sockets[0]; assert.equal(new URL(ws.url).pathname, '/dynamic');
    contexts[0].processor.onaudioprocess({ inputBuffer: { getChannelData: () => new Float32Array(4000).fill(.25) } });
    await pause(230);
    assert.equal(ws.sent.length, 2);
    for (const message of ws.sent) assert.equal(Buffer.from(message.value.source_media_chunk.data, 'base64').length, 3200);
    assert.ok(ws.sent[1].at - ws.sent[0].at >= 50);
    ws.message({ source_transcript_update: { concluded: [segment('Source')], tentative: [] } }); assert.equal(events.length, 0);
    ws.message({ target_transcript_update: { language: 'nl', concluded: [segment('Hallo')], tentative: [] } }); assert.equal(events.length, 1);
    let ended = false; const stopping = session.stop().then(() => { ended = true; });
    await pause(100); assert.deepEqual(ws.sent.at(-1).value, { end_of_source_media: {} });
    ws.message({ end_of_target_transcript: { language: 'nl' } }); await pause(10); assert.equal(ended, false);
    ws.message({ end_of_stream: {} }); await stopping; await session.stop();
    assert.equal(trackStops, 0); assert.equal(contexts[0].state, 'closed'); assert.deepEqual(errors, []);
  } finally { global.WebSocket = previous.WebSocket; global.AudioContext = previous.AudioContext; }
});
