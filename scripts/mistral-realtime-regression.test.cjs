const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const filename = path.resolve(__dirname, '../packages/aihappey-core/src/features/transcriptions/realtime/startMistralRealtimeWsSession.ts');
const moduleUnderTest = { exports: {} };
new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(id => { throw new Error(`Unexpected runtime dependency: ${id}`); }, moduleUnderTest, moduleUnderTest.exports);
const { buildMistralSessionUpdate, mistralRealtimeUrl, startMistralRealtimeWsSession } = moduleUnderTest.exports;
const modelId = 'mistral/voxtral-mini-transcribe-realtime-3';
const tick = () => new Promise(resolve => setImmediate(resolve));

function environment(t, mediaFactory) {
  let socket, audio, stopped = 0, captures = 0;
  class Socket {
    static OPEN = 1;
    readyState = 1; bufferedAmount = 0; listeners = {}; sent = [];
    constructor(url, protocols) { this.url = url; this.protocols = protocols; socket = this; }
    addEventListener(type, callback) { (this.listeners[type] ??= []).push(callback); }
    emit(type, event = {}) { for (const callback of this.listeners[type] ?? []) callback(event); }
    receive(message) { this.emit('message', { data: JSON.stringify(message) }); }
    send(text) { assert.equal(this.readyState, 1); this.sent.push(JSON.parse(text)); }
    close() { if (this.readyState === 3) return; this.readyState = 3; this.emit('close', { code: 1000 }); }
  }
  class Context {
    sampleRate = 16000; state = 'running'; destination = {};
    constructor() { audio = this; }
    node() { return { connect() {}, disconnect() {} }; }
    createMediaStreamSource() { return this.node(); }
    createScriptProcessor() { return this.processor = this.node(); }
    createGain() { return { ...this.node(), gain: { value: 1 } }; }
    async close() { this.state = 'closed'; }
    async resume() { }
    frame(samples = [-1, 0, 1, .5]) { this.processor.onaudioprocess?.({ inputBuffer: { getChannelData: () => Float32Array.from(samples) } }); }
  }
  const stream = { getTracks: () => [{ stop() { stopped++; } }] };
  for (const [name, value] of Object.entries({ WebSocket: Socket, AudioContext: Context,
    navigator: { mediaDevices: { getUserMedia: async () => { captures++; return mediaFactory ? mediaFactory(stream) : stream; } } } })) {
    const old = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => old ? Object.defineProperty(globalThis, name, old) : delete globalThis[name]);
  }
  const texts = [], errors = [], events = [];
  const start = (extra = {}) => startMistralRealtimeWsSession({ modelId,
    getEphemeralToken: async () => ({ value: 'rt_fixture.jwt', expires_at: Math.floor(Date.now() / 1000) + 900 }),
    events: { onTranscriptText: text => texts.push(text), onError: message => errors.push(message), onEvent: message => events.push(message) }, ...extra });
  const ready = async () => {
    socket.receive({ type: 'session.created', session: {} });
    const session = socket.sent.at(-1).session;
    socket.receive({ type: 'session.updated', session });
    await tick();
  };
  return { start, ready, texts, errors, events, socket: () => socket, audio: () => audio, stopped: () => stopped, captures: () => captures };
}

test('Mistral model IDs stay exact and configuration accepts only documented delay values', () => {
  assert.equal(new URL(mistralRealtimeUrl(modelId)).searchParams.get('model'), 'voxtral-mini-transcribe-realtime-3');
  assert.throws(() => mistralRealtimeUrl('mistral/voxtral-mini-transcribe-3'));
  for (const delay of [80, 480, 1200, 2400]) assert.equal(buildMistralSessionUpdate({ target_streaming_delay_ms: delay }).session.target_streaming_delay_ms, delay);
  for (const delay of [79, 1201, 2399, 2401, 480.5, NaN]) assert.throws(() => buildMistralSessionUpdate({ target_streaming_delay_ms: delay }));
  assert.throws(() => buildMistralSessionUpdate({ language: 'english' }));
  assert.throws(() => buildMistralSessionUpdate({ context_bias: 'not-an-array' }));
  assert.deepEqual(buildMistralSessionUpdate().session.audio_format, { encoding: 'pcm_s16le', sample_rate: 16000 });
});

test('Mistral authenticates with subprotocols, waits for session.updated, frames PCM16, and finalizes once', async t => {
  const h = environment(t);
  const pending = h.start({ config: { language: 'nl', context_bias: ['Rotterdam'] } });
  await tick();
  assert.deepEqual(h.socket().protocols, ['realtime', 'rt_fixture.jwt']);
  assert.doesNotMatch(h.socket().url, /rt_|access_token|api_key/);
  assert.equal(h.captures(), 0); assert.deepEqual(h.socket().sent, []);
  h.socket().receive({ type: 'session.created', session: {} });
  assert.equal(h.captures(), 0);
  assert.equal(h.socket().sent[0].type, 'session.update');
  assert.equal(h.socket().sent[0].session.language, 'nl');
  assert.deepEqual(h.socket().sent[0].session.context_bias, ['Rotterdam']);
  h.socket().receive({ type: 'session.updated', session: h.socket().sent[0].session });
  const session = await pending;
  h.audio().frame();
  const append = h.socket().sent.at(-1);
  assert.equal(append.type, 'input_audio.append');
  const bytes = Buffer.from(append.audio, 'base64');
  assert.deepEqual([bytes.readInt16LE(0), bytes.readInt16LE(2), bytes.readInt16LE(4)], [-32768, 0, 32767]);
  for (const text of ['  Hello', ' world', '.\n']) h.socket().receive({ type: 'transcription.text.delta', text });
  assert.equal(h.texts.at(-1), '  Hello world.\n');
  let complete = false;
  const stop = session.stop().then(() => { complete = true; });
  await tick(); assert.equal(complete, false);
  assert.equal(h.socket().sent.at(-1).type, 'input_audio.end');
  h.socket().receive({ type: 'transcription.done', text: '  Final transcript.\n' });
  await stop; await session.stop();
  assert.equal(h.texts.at(-1), '  Final transcript.\n');
  assert.equal(h.socket().sent.filter(message => message.type === 'input_audio.end').length, 1);
  assert.equal(h.stopped(), 1); assert.equal(h.audio().state, 'closed'); assert.deepEqual(h.errors, []);
});

test('Mistral does not treat an early close as successful finalization and retains received text', async t => {
  const h = environment(t); const pending = h.start(); await tick(); await h.ready(); const session = await pending;
  h.socket().receive({ type: 'transcription.text.delta', text: 'Confirmed' });
  const stop = session.stop(); await tick(); h.socket().close(); await stop;
  assert.equal(h.texts.at(-1), 'Confirmed'); assert.equal(h.errors.length, 1); assert.equal(h.stopped(), 1);
});

test('Mistral rejects incompatible readiness settings before microphone capture', async t => {
  const h = environment(t); const pending = h.start(); await tick();
  const rejected = assert.rejects(pending, /incompatible/);
  h.socket().receive({ type: 'session.created', session: {} });
  h.socket().receive({ type: 'session.updated', session: { audio_format: { encoding: 'pcm_s16le', sample_rate: 24000 }, target_streaming_delay_ms: 480 } });
  await rejected; assert.equal(h.captures(), 0); assert.equal(h.errors.length, 1);
});

test('Mistral backpressure fails explicitly instead of silently dropping microphone audio', async t => {
  const h = environment(t); const pending = h.start(); await tick(); await h.ready(); const session = await pending;
  h.socket().bufferedAmount = 1_000_001; h.audio().frame(); await tick();
  assert.match(h.errors[0], /cannot keep up/);
  assert.equal(h.socket().sent.filter(message => message.type === 'input_audio.append').length, 0);
  await session.stop(); assert.equal(h.stopped(), 1);
});

test('Mistral cancellation while microphone permission is pending releases late capture', async t => {
  let release;
  const h = environment(t, stream => new Promise(resolve => { release = () => resolve(stream); }));
  const abort = new AbortController(); const pending = h.start({ signal: abort.signal }); await tick(); await h.ready();
  const rejected = assert.rejects(pending);
  abort.abort(); release(); await rejected;
  assert.equal(h.stopped(), 1); assert.equal(h.errors.length, 1);
});

test('Mistral provider errors never surface raw credentials and repeated terminal events report once', async t => {
  const h = environment(t); const pending = h.start(); await tick();
  const rejected = assert.rejects(pending, /transcription error/);
  h.socket().receive({ type: 'error', error: { message: 'rt_do-not-disclose server-api-key' } });
  h.socket().emit('error'); await rejected;
  assert.equal(h.errors.length, 1); assert.doesNotMatch(h.errors[0], /rt_do-not-disclose|server-api-key/);
});
