const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { renderer } = require('./react-test-renderer.cjs');
const root = path.resolve(__dirname, '../packages/aihappey-core/src/features/transcriptions/realtime');
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
const protocol = load(path.join(root, 'speechmaticsRealtime.ts'));
const { startSpeechmaticsRealtimeWsSession } = load(path.join(root, 'startSpeechmaticsRealtimeWsSession.ts'));
const tick = () => new Promise(resolve => setImmediate(resolve));
const event = (message, transcript, start_time = 0, end_time = 1) => ({ message,
  metadata: { transcript, start_time, end_time }, ...(message.includes('Segment') ? { segment: { transcript } } : {}) });

test('Speechmatics routes five exact models across four regions and separates protocol/token settings', () => {
  for (const model of ['standard', 'enhanced', 'melia-1', 'oak-1', 'linden-1']) {
    for (const region of ['global', 'eu', 'us', 'au']) {
      const id = 'speechmatics/' + model;
      assert.equal(protocol.speechmaticsConnection(id, { region }), `wss://${region}.rt.speechmatics.com/v2${model === 'linden-1' ? '/agent' : ''}`);
      const setup = protocol.speechmaticsStart(id, { ttl: 60, transcription_config: { language: 'nl', additional_vocab: [{ content: 'AIHappey', sounds_like: ['AI happy'] }] },
        realtime_config: { max_delay: .7 }, agent_config: { emit_sentences: true } });
      assert.deepEqual(setup.audio_format, { type: 'raw', encoding: 'pcm_s16le', sample_rate: 16000 });
      assert.equal(setup.transcription_config.language, ['melia-1', 'oak-1'].includes(model) ? 'multi' : 'nl');
      assert.equal(setup.transcription_config.model, model); assert.equal(setup.transcription_config.enable_partials, true);
      assert.equal(setup.transcription_config.ttl, undefined);
      if (model === 'linden-1') { assert.equal(setup.transcription_config.max_delay, undefined); assert.deepEqual(setup.turn_config, { turn_detection_mode: 'vad' }); }
      else assert.equal(setup.transcription_config.emit_sentences, undefined);
    }
  }
  for (const ttl of [59, 86401, 60.5, NaN, '60']) assert.throws(() => protocol.speechmaticsStart('standard', { ttl }));
  for (const model of ['tts', 'speechmatics/tts/voice/sarah', 'unknown']) assert.throws(() => protocol.speechmaticsConnection(model));
  assert.throws(() => protocol.speechmaticsConnection('standard', { region: 'evil.test' }));
  assert.throws(() => protocol.speechmaticsStart('linden-1', { transcription_config: { max_delay: 1 } }));
  assert.throws(() => protocol.speechmaticsStart('oak-1', { realtime_config: { conversation_config: { end_of_utterance_silence_trigger: 1 } } }));
  assert.throws(() => protocol.speechmaticsStart('standard', { realtime_config: { language_hints: ['nl'] } }));
  assert.equal(protocol.speechmaticsStart('standard').transcription_config.language, 'en');
});

test('Speechmatics regular text preserves punctuation, whitespace and CJK; partials replace, finals deduplicate', () => {
  const transcript = new protocol.SpeechmaticsTranscript();
  transcript.apply(event('AddPartialTranscript', 'wrong'));
  transcript.apply(event('AddPartialTranscript', 'replacement'));
  assert.equal(transcript.snapshot().text, ''); assert.equal(transcript.snapshot().displayText, 'replacement');
  const first = event('AddTranscript', '你好，'); transcript.apply(first); transcript.apply(first);
  transcript.apply(event('AddTranscript', '世界。 ', 1, 2));
  transcript.apply(event('AddPartialTranscript', 'draft', 2, 3));
  assert.equal(transcript.snapshot().text, '你好，世界。 ');
  assert.equal(transcript.snapshot().segments.length, 2); assert.equal(transcript.snapshot().durationInSeconds, 2);
  transcript.apply({ message: 'EndOfTranscript' }); assert.equal(transcript.snapshot().displayText, '你好，世界。 ');
  assert.throws(() => transcript.apply(event('AddTranscript', 'invalid', 5, 2)));
});

test('Agent STT stores stable segments and timestamps, never commits turn/VAD signals or previews', () => {
  const transcript = new protocol.SpeechmaticsTranscript();
  transcript.apply(event('AddSegment', 'Hello', 0, .5));
  transcript.apply(event('AddPartialSegment', 'draft', .5, 1));
  assert.equal(transcript.snapshot().displayText, 'Hello draft'); assert.equal(transcript.snapshot().text, 'Hello');
  assert.equal(transcript.apply({ message: 'EndOfTurn' }), false);
  transcript.apply(event('AddSegment', 'world.', .5, 1));
  assert.equal(transcript.snapshot().text, 'Hello world.');
});

function environment(t) {
  let socket, audio, captures = 0, trackStops = 0;
  class Socket {
    static OPEN = 1; readyState = 1; bufferedAmount = 0; listeners = {}; sent = [];
    constructor(url) { this.url = url; socket = this; queueMicrotask(() => this.emit('open')); }
    addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
    emit(type, event) { for (const fn of this.listeners[type] ?? []) fn(event); }
    receive(value) { this.emit('message', { data: JSON.stringify(value) }); }
    send(value) { assert.equal(this.readyState, 1); this.sent.push(typeof value === 'string' ? JSON.parse(value) : Buffer.from(value)); }
    close() { if (this.readyState === 3) return; this.readyState = 3; this.emit('close', { code: 1000, reason: 'temporary.jwt.fixture' }); }
  }
  const node = () => ({ connect() {}, disconnect() {} });
  class Context {
    sampleRate = 16000; state = 'running'; destination = {};
    constructor() { audio = this; }
    createMediaStreamSource() { return node(); } createGain() { return { ...node(), gain: {} }; }
    createScriptProcessor() { return this.processor = node(); }
    async resume() {} async close() { this.state = 'closed'; }
    frame() { this.processor.onaudioprocess?.({ inputBuffer: { getChannelData: () => new Float32Array([-1, 0, 1, .5]) } }); }
  }
  for (const [name, value] of Object.entries({ WebSocket: Socket, AudioContext: Context,
    navigator: { mediaDevices: { getUserMedia: async () => { captures++; return { getTracks: () => [{ stop() { trackStops++; } }] }; } } } })) {
    const old = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => old ? Object.defineProperty(globalThis, name, old) : delete globalThis[name]);
  }
  const errors = [], events = [];
  const start = (extra = {}) => startSpeechmaticsRealtimeWsSession({ modelId: 'speechmatics/standard',
    getEphemeralToken: async () => ({ value: 'temporary.jwt.fixture', expires_at: Date.now() / 1000 + 60 }),
    events: { onError: message => errors.push(message), onEvent: value => events.push(value) }, ...extra });
  return { start, errors, events, socket: () => socket, audio: () => audio, captures: () => captures, stopped: () => trackStops };
}

for (const model of ['standard', 'linden-1']) test(`Speechmatics ${model} gates capture, sends binary PCM and drains final events exactly once`, async t => {
  const h = environment(t), pending = h.start({ modelId: 'speechmatics/' + model }); await tick();
  assert.equal(h.captures(), 0); assert.equal(h.socket().sent[0].message, 'StartRecognition');
  assert.equal(new URL(h.socket().url).searchParams.get('jwt'), 'temporary.jwt.fixture');
  h.socket().receive({ message: 'Info', reason: 'usage' }); assert.equal(h.captures(), 0);
  h.socket().receive({ message: 'RecognitionStarted', id: 'session' });
  const session = await pending; h.audio().frame();
  assert.deepEqual(h.socket().sent[1], Buffer.from([0, 128, 0, 0, 255, 127]));
  h.socket().receive({ message: 'AudioAdded', seq_no: 1 });
  const stopping = session.stop(); assert.equal(session.stop(), stopping); await tick();
  assert.deepEqual(h.socket().sent.at(-1), { message: 'EndOfStream', last_seq_no: 1 });
  h.socket().receive(event(model === 'linden-1' ? 'AddSegment' : 'AddTranscript', 'Final'));
  h.socket().receive({ message: 'EndOfTranscript' }); await stopping;
  assert.equal(h.stopped(), 1); assert.deepEqual(h.errors, []); assert.equal(h.events.at(-1).message, 'EndOfTranscript');
});

test('Speechmatics empty audio ends with sequence zero and never owns an injected stream', async t => {
  const h = environment(t), pending = h.start({ microphoneStream: { getTracks: () => [{ stop() { throw new Error('Caller owns input'); } }] } });
  await tick(); h.socket().receive({ message: 'RecognitionStarted' }); const session = await pending;
  const stopping = session.stop(); await tick(); assert.equal(h.socket().sent.at(-1).last_seq_no, 0);
  h.socket().receive({ message: 'EndOfTranscript' }); await stopping; assert.equal(h.captures(), 0);
});

test('Speechmatics in-band error/close reasons never expose temporary credentials', async t => {
  const h = environment(t), pending = h.start(); await tick(); h.socket().receive({ message: 'RecognitionStarted' }); const session = await pending;
  h.socket().receive({ message: 'Error', reason: 'temporary.jwt.fixture', type: 'quota_exceeded' });
  await assert.rejects(session.stop()); assert.equal(h.stopped(), 1); assert.equal(h.errors.length, 1);
  assert.doesNotMatch(h.errors.join(' '), /temporary\.jwt/);
});

test('Speechmatics rejects cancellation before token resolution without opening a connection', async () => {
  let release; const token = new Promise(resolve => { release = resolve; }); const abort = new AbortController();
  const pending = startSpeechmaticsRealtimeWsSession({ modelId: 'standard', signal: abort.signal, getEphemeralToken: () => token });
  abort.abort(); release({}); await assert.rejects(pending, error => error.name === 'AbortError');
});

test('Speechmatics setup timeout never captures audio and final timeout never claims success', async t => {
  const h = environment(t), original = globalThis.setTimeout;
  globalThis.setTimeout = (callback, milliseconds, ...args) => original(callback, milliseconds === 40000 || milliseconds === 15000 ? 5 : milliseconds, ...args);
  t.after(() => { globalThis.setTimeout = original; });
  await assert.rejects(h.start(), /timed out/); assert.equal(h.captures(), 0);
  const pending = h.start(); await tick(); h.socket().receive({ message: 'RecognitionStarted' }); const session = await pending;
  await assert.rejects(session.stop(), /final transcript/); assert.equal(h.stopped(), 1);
});

test('Speechmatics startup abort and upload backpressure release capture without silently losing audio', async t => {
  const h = environment(t), abort = new AbortController();
  const pending = h.start({ signal: abort.signal }); await tick(); abort.abort(); await assert.rejects(pending, /cancelled/);
  assert.equal(h.captures(), 0);
  const connected = h.start(); await tick(); h.socket().receive({ message: 'RecognitionStarted' }); const session = await connected;
  h.socket().bufferedAmount = 1_000_001; h.audio().frame(); await assert.rejects(session.stop(), /keep up/);
  assert.equal(h.socket().sent.filter(Buffer.isBuffer).length, 0); assert.equal(h.stopped(), 1);
});

test('Speechmatics close after EOS but before final confirmation rejects Stop and ignores credential-bearing close reason', async t => {
  const h = environment(t), pending = h.start(); await tick(); h.socket().receive({ message: 'RecognitionStarted' }); const session = await pending;
  const stop = session.stop(); await tick(); h.socket().close(); await assert.rejects(stop, /confirming the final transcript/);
  assert.doesNotMatch(h.errors.join(' '), /temporary\.jwt/);
});

async function libraryHarness({ fail = false, model = 'standard' } = {}) {
  const view = renderer(); let controller, events, stopped = 0;
  const writes = [], deletes = [];
  const state = { customHeaders: {}, providerRealtimeMetadata: {}, setRealtimeSessionState(patch) { Object.assign(state, patch); }, resetRealtimeSessionState() {} };
  const mocks = { react: view.react, 'aihappey-state': { useAppStore: select => select(state) },
    'aihappey-i18n': { useTranslation: () => ({ t: value => value }) }, 'aihappey-ai': { getRealtimeToken: async () => async () => ({}) },
    '../../provider-credentials/scopedRequest': { buildOperationHeaders: async () => ({}) },
    './startRealtimeWebrtcSession': { startRealtimeWebrtcSession: async args => {
      events = args.events;
      return { stop: async () => { stopped++; if (fail) throw new Error('Finalization failed');
        events.onEvent(event(model === 'linden-1' ? 'AddSegment' : 'AddTranscript', model === 'linden-1' ? 'world' : ' world', 1, 2));
        events.onEvent({ message: 'EndOfTranscript' }); } };
    } }, '../../realtime/googleLiveConfig': { buildGoogleLiveTokenPayload() {} }, '../transcriptionErrors': { getTranscriptionErrorMessage: String } };
  const { useRealtimeTranscriptionController } = load(path.join(root, 'useRealtimeTranscriptionController.ts'), mocks);
  const args = { config: { baseUrl: 'https://gateway/', endpoints: { realtime: 'token' } }, selectedModel: { id: 'speechmatics/' + model, tags: ['real-time'] },
    transcriptions: { async add() { return { id: 'record' }; }, async update(id, patch) { writes.push(structuredClone(patch.transcription)); }, async delete(id) { deletes.push(id); } } };
  function Component() { controller = useRealtimeTranscriptionController(args); return null; }
  view.render(Component, {}); await controller.start();
  return { controller, events, writes, deletes, state, stopped: () => stopped, rerender: () => view.render(Component, {}) };
}

for (const model of ['standard', 'linden-1']) test(`Speechmatics ${model} controller persists only confirmed text after final drain and rejects stale callbacks`, async () => {
  const h = await libraryHarness({ model });
  h.events.onEvent(event(model === 'linden-1' ? 'AddSegment' : 'AddTranscript', 'Hello'));
  h.events.onEvent(event(model === 'linden-1' ? 'AddPartialSegment' : 'AddPartialTranscript', ' draft', 1, 2));
  await tick(); assert.equal(h.writes.at(-1).text, 'Hello'); h.rerender();
  await h.controller.stop(); await h.controller.stop();
  assert.equal(h.stopped(), 1); assert.equal(h.writes.at(-1).text, 'Hello world'); assert.equal(h.writes.at(-1).response.body.status, 'completed');
  const count = h.writes.length; h.events.onEvent(event('AddTranscript', 'late', 2, 3)); await tick(); assert.equal(h.writes.length, count);
  assert.ok(!JSON.stringify(h.writes).includes('draft')); assert.deepEqual(h.deletes, []);
});

test('Speechmatics finalization errors retain confirmed text; interim-only errors delete empty recordings', async () => {
  const h = await libraryHarness({ fail: true }); h.events.onEvent(event('AddTranscript', 'Confirmed')); h.events.onEvent(event('AddPartialTranscript', 'draft', 1, 2));
  await h.controller.stop(); assert.equal(h.writes.at(-1).text, 'Confirmed'); assert.equal(h.writes.at(-1).response.body.status, 'error'); assert.equal(h.state.realtimeText, 'Confirmed');
  const draft = await libraryHarness({ fail: true }); draft.events.onEvent(event('AddPartialTranscript', 'only draft'));
  draft.events.onError('Disconnected'); await tick(); await tick(); assert.deepEqual(draft.deletes, ['record']); assert.deepEqual(draft.writes, []);
});

test('Speechmatics authoritative catalog exposes exactly the five documented STT models as token-capable', () => {
  const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../aihappey-providers/metadata/models/providers/speechmatics.json'), 'utf8')).data;
  const models = data.filter(model => model.type === 'transcription'); assert.equal(models.length, 5);
  for (const model of models) { protocol.speechmaticsModel(model.id); assert.ok(model.tags.includes('real-time')); assert.ok(model.tags.includes('realtime-token')); }
  for (const model of data.filter(model => model.type === 'speech')) assert.ok(!model.tags?.includes('real-time'));
});
