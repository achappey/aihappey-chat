const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { renderer } = require('./react-test-renderer.cjs');

const source = path.resolve(__dirname, '../packages/aihappey-core/src/features/transcriptions/realtime');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
function load(file, mocks = {}, globals = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', ...Object.keys(globals), code)(id => {
    if (id in mocks) return mocks[id];
    if (id.startsWith('.')) return load(path.resolve(path.dirname(file), id + '.ts'), mocks, globals);
    throw new Error('Unexpected import: ' + id);
  }, module, module.exports, ...Object.values(globals));
  return module.exports;
}

function transportHarness({ token, microphone, answerOk = true, open = true } = {}) {
  const errors = [], received = [], sent = [];
  let trackStops = 0, peerCloses = 0, channelCloses = 0, channelCreated = false;
  const track = { stop() { trackStops++; } };
  const stream = { getTracks: () => [track] };
  class Channel extends EventTarget {
    readyState = 'connecting';
    send(json) { const event = JSON.parse(json); sent.push(event); this.onSend?.(event); }
    close() { if (this.readyState === 'closed') return; channelCloses++; this.readyState = 'closed'; this.dispatchEvent(new Event('close')); }
    emit(event) { this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(event) })); }
  }
  const dc = new Channel();
  class Peer extends EventTarget {
    connectionState = 'new';
    addTrack() {}
    createDataChannel() { channelCreated = true; return dc; }
    async createOffer() { return { sdp: 'offer' }; }
    async setLocalDescription() {}
    async setRemoteDescription() { if (open) { dc.readyState = 'open'; dc.dispatchEvent(new Event('open')); } }
    getSenders() { return [{ track }]; }
    close() { if (this.connectionState === 'closed') return; peerCloses++; this.connectionState = 'closed'; if (channelCreated) dc.close(); }
  }
  const { startOpenAiRealtimeWebrtcSession } = load(path.join(source, 'openaiRealtimeWebrtc.ts'), {}, {
    RTCPeerConnection: Peer,
    navigator: { mediaDevices: { getUserMedia: () => microphone ?? Promise.resolve(stream) } },
    fetch: async () => ({ ok: answerOk, status: 400, text: async () => answerOk ? 'answer' : 'invalid offer' }),
    // Keep timeout/settling tests fast without replacing the event-driven behavior.
    setTimeout: (fn, ms) => setTimeout(fn, Math.min(ms, 100)), clearTimeout,
  });
  const abort = new AbortController();
  const start = (options = {}) => startOpenAiRealtimeWebrtcSession({
    getEphemeralToken: () => token ?? Promise.resolve({ value: 'ephemeral-fixture' }),
    signal: abort.signal,
    events: { onEvent: event => received.push(event), onError: message => errors.push(message) },
    ...options,
  });
  return { start, dc, abort, stream, errors, received, sent,
    counts: () => ({ trackStops, peerCloses, channelCloses }) };
}

function controllerHarness({ model = 'gpt-transcribe', slowSave = false, saveError, pendingSetup = false, setupError, transport, durableStore } = {}) {
  const view = renderer();
  let controller, mounted = true, releaseSave, releaseSetup, stopBehavior = async () => {}, stopped = 0, serial = 0;
  const saveGate = new Promise(resolve => { releaseSave = resolve; });
  const setupGate = new Promise(resolve => { releaseSetup = resolve; });
  const sessions = [], writes = [], deleted = [], alerts = [], stored = new Map();
  const state = { customHeaders: {}, providerRealtimeMetadata: {}, realtimeStatus: 'idle', realtimeText: '',
    setRealtimeSessionState(patch) { Object.assign(state, patch); },
    resetRealtimeSessionState() { Object.assign(state, { realtimeStatus: 'idle', realtimeText: '', realtimeActiveTranscriptionId: null }); } };
  const args = { config: { baseUrl: 'https://gateway/', endpoints: { realtime: 'token' } },
    selectedModel: { id: 'openai/' + model, tags: ['real-time'] }, onErrorAlert: message => alerts.push(message) };
  const store = {
    async add(name, blob, transcription) {
      const id = durableStore ? (await durableStore.add(name, blob, transcription)).id : 'item-' + ++serial;
      stored.set(id, structuredClone(transcription)); replaceContext(); return { id };
    },
    async update(id, patch) {
      if (slowSave) await saveGate;
      if (saveError) throw new Error(saveError);
      if (durableStore) await durableStore.update(id, patch);
      const result = structuredClone(patch.transcription); writes.push({ id, ...result }); stored.set(id, result); replaceContext();
      return { id, transcription: result };
    },
    async delete(id) { if (durableStore) await durableStore.delete(id); deleted.push(id); stored.delete(id); replaceContext(); },
  };
  function render() { view.render(Component, {}); }
  function replaceContext() { args.transcriptions = { ...store, items: [...stored.values()] }; if (mounted) render(); }
  const mocks = {
    react: view.react,
    'aihappey-state': { useAppStore: select => select(state) },
    'aihappey-i18n': { useTranslation: () => ({ t: text => text }) },
    'aihappey-ai': { getRealtimeToken: async () => async () => ({ value: 'ephemeral-fixture' }) },
    '../../provider-credentials/scopedRequest': { buildOperationHeaders: async () => ({}) },
    './startRealtimeWebrtcSession': { startRealtimeWebrtcSession: async options => {
      sessions.push(options); if (pendingSetup) await setupGate;
      if (setupError) throw new Error(setupError);
      if (transport) {
        const session = await transport.start(options);
        return { kind: 'webrtc', stop: async () => { stopped++; return session.stop(); } };
      }
      return { kind: 'webrtc', stop: async () => { stopped++; await stopBehavior(options.events); } };
    } },
    './realtimeProviders': { parseProviderIdFromModelId: id => id?.split('/')[0] },
    '../transcriptionErrors': { getTranscriptionErrorMessage: error => String(error) },
    '../../realtime/googleLiveConfig': { buildGoogleLiveTokenPayload: () => ({}) },
  };
  const { useRealtimeTranscriptionController } = load(path.join(source, 'useRealtimeTranscriptionController.ts'), mocks);
  function Component() { controller = useRealtimeTranscriptionController(args); return null; }
  function Empty() { return null; }
  replaceContext();
  return { controller: () => controller, events: () => sessions.at(-1).events, state, writes, stored, deleted, alerts, sessions,
    setStop: behavior => { stopBehavior = behavior; }, stopped: () => stopped, releaseSave, releaseSetup, replaceContext,
    selectModel(id) { args.selectedModel = { id, tags: ['real-time'] }; render(); },
    unmount() { mounted = false; view.render(Empty, {}); } };
}

const final = (item_id, transcript) => ({ type: 'conversation.item.input_audio_transcription.completed', item_id, transcript });
const delta = (item_id, text) => ({ type: 'conversation.item.input_audio_transcription.delta', item_id, delta: text });

test('intentional OpenAI Stop is idempotent and does not report a disconnect', async () => {
  const h = transportHarness(), session = await h.start();
  const first = session.stop(), second = session.stop();
  assert.equal(first, second);
  await Promise.all([first, second]);
  assert.deepEqual(h.errors, []);
  assert.deepEqual(h.counts(), { trackStops: 1, peerCloses: 1, channelCloses: 1 });
});

test('Stop mid-utterance stops capture, commits audio, and receives the authoritative final before closing', async () => {
  const h = transportHarness(), session = await h.start();
  h.dc.emit({ type: 'input_audio_buffer.speech_started', item_id: 'a', audio_start_ms: 0 });
  h.dc.onSend = event => {
    if (event.type !== 'input_audio_buffer.commit') return;
    assert.equal(h.counts().trackStops, 1);
    h.dc.emit({ type: 'input_audio_buffer.committed', item_id: 'a' });
    setTimeout(() => h.dc.emit(final('a', 'Final words.')), 20);
  };
  await session.stop();
  assert.equal(h.sent.filter(event => event.type === 'input_audio_buffer.commit').length, 1);
  assert.equal(h.received.at(-1).transcript, 'Final words.');
  assert.deepEqual(h.errors, []);
});

test('failed SDP setup releases the microphone, peer, and data channel', async () => {
  const h = transportHarness({ answerOk: false });
  await assert.rejects(h.start(), /SDP/);
  assert.deepEqual(h.counts(), { trackStops: 1, peerCloses: 1, channelCloses: 1 });
});

for (const model of ['gpt-transcribe', 'gpt-transcribe-live']) {
  test(`${model}: Stop saves the final result, awaits storage, and retains readable text`, async () => {
    const h = controllerHarness({ model, slowSave: true });
    await h.controller().start();
    h.events().onEvent(delta('a', 'provisional'));
    h.setStop(async events => { await pause(5); events.onEvent(final('a', 'Authoritative final.')); });
    let finished = false;
    const stopping = h.controller().stop().then(() => { finished = true; });
    await pause(20);
    assert.equal(finished, false, 'Stop must await the storage transaction');
    assert.equal(h.state.realtimeStatus, 'stopping');
    h.releaseSave(); await stopping;
    assert.equal(h.stored.get('item-1').text, 'Authoritative final.');
    assert.equal(h.stored.get('item-1').response.body.status, 'completed');
    assert.equal(h.state.realtimeText, 'Authoritative final.');
    assert.deepEqual(h.deleted, []); assert.deepEqual(h.alerts, []);
    h.unmount();
  });
}

test('OpenAI finals replace per-item previews and use committed order even without timing events', async () => {
  const h = controllerHarness(); await h.controller().start();
  const events = h.events();
  events.onEvent(delta('a', 'Wrong preview.'));
  events.onEvent({ type: 'input_audio_buffer.committed', item_id: 'b', previous_item_id: 'a' });
  events.onEvent(final('b', 'Second.'));
  events.onEvent(final('a', 'First.'));
  events.onEvent(delta('a', 'late duplicate'));
  assert.equal(h.state.realtimeText, 'First. Second.');
  await h.controller().stop();
  assert.equal(h.writes.at(-1).text, 'First. Second.');
  assert.deepEqual(h.alerts, []); h.unmount();
});

test('late callbacks cannot overwrite the stopped transcript or a newly started session', async () => {
  const h = controllerHarness(); await h.controller().start(); const old = h.events();
  old.onEvent(final('a', 'Saved first.')); await h.controller().stop();
  await h.controller().start();
  old.onEvent(final('late', 'Obsolete words')); old.onTranscriptText('obsolete'); old.onError('obsolete disconnect');
  h.events().onEvent(final('new', 'Saved second.')); await h.controller().stop();
  await pause(450);
  assert.equal(h.stored.get('item-1').text, 'Saved first.');
  assert.equal(h.stored.get('item-2').text, 'Saved second.');
  assert.equal(h.state.realtimeText, 'Saved second.');
  assert.deepEqual(h.alerts, []); h.unmount();
});

test('already committed audio is not committed twice and all pending finals are drained', async () => {
  const h = transportHarness(), session = await h.start();
  h.dc.emit({ type: 'input_audio_buffer.speech_started', item_id: 'a' });
  h.dc.emit({ type: 'input_audio_buffer.committed', item_id: 'a' });
  h.dc.emit({ type: 'input_audio_buffer.committed', item_id: 'b', previous_item_id: 'a' });
  const stopping = session.stop();
  setTimeout(() => h.dc.emit(final('b', 'Second.')), 20);
  setTimeout(() => h.dc.emit(final('a', 'First.')), 120);
  await stopping;
  assert.deepEqual(h.sent, []);
  assert.equal(h.received.at(-1).transcript, 'First.');
  assert.deepEqual(h.errors, []);
});

test('manual turn detection commits buffered audio even without speech events', async () => {
  const h = transportHarness(), session = await h.start();
  h.dc.emit({ type: 'session.created', session: { type: 'transcription', audio: { input: { turn_detection: null } } } });
  h.dc.onSend = event => {
    if (event.type !== 'input_audio_buffer.commit') return;
    h.dc.emit({ type: 'input_audio_buffer.committed', item_id: 'manual' });
    setTimeout(() => h.dc.emit(final('manual', 'Manual final.')), 10);
  };
  await session.stop();
  assert.equal(h.sent.length, 1);
  assert.equal(h.received.at(-1).transcript, 'Manual final.');
  assert.deepEqual(h.errors, []);
});

test('a correlated empty commit caused by VAD racing Stop is benign', async () => {
  const h = transportHarness(), session = await h.start();
  h.dc.emit({ type: 'input_audio_buffer.speech_started', item_id: 'a' });
  h.dc.onSend = event => {
    h.dc.emit({ type: 'error', error: { event_id: event.event_id, code: 'input_audio_buffer_commit_empty', message: 'already committed' } });
    h.dc.emit({ type: 'input_audio_buffer.committed', item_id: 'a' });
    h.dc.emit(final('a', 'Retained.'));
  };
  await session.stop(); assert.deepEqual(h.errors, []);
});

test('missing final results time out, release devices, and do not fabricate success', async () => {
  const h = transportHarness(), session = await h.start();
  h.dc.emit({ type: 'input_audio_buffer.committed', item_id: 'pending' });
  await assert.rejects(session.stop(), /Timed out waiting for the final/);
  assert.deepEqual(h.counts(), { trackStops: 1, peerCloses: 1, channelCloses: 1 });
  assert.deepEqual(h.errors, [], 'the stop rejection owns the error, not a recursive error callback');
});

test('real disconnect and provider errors are still reported exactly once', async () => {
  for (const error of ['disconnect', 'provider']) {
    const h = transportHarness(), session = await h.start();
    if (error === 'disconnect') h.dc.close();
    else h.dc.emit({ type: 'conversation.item.input_audio_transcription.failed', item_id: 'a', error: { message: 'Provider failed.' } });
    h.dc.dispatchEvent(new Event('error'));
    assert.equal(h.errors.length, 1);
    await session.stop();
    assert.equal(h.counts().trackStops, 1);
  }
});

test('cancelling a pending microphone permission request releases the late stream', async () => {
  let release;
  const h = transportHarness({ microphone: new Promise(resolve => { release = resolve; }) });
  const starting = h.start(); await pause(5); h.abort.abort(); release(h.stream);
  await assert.rejects(starting, { name: 'AbortError' });
  assert.deepEqual(h.counts(), { trackStops: 1, peerCloses: 1, channelCloses: 0 });
  assert.deepEqual(h.errors, []);
});

test('cancelling a pending token never opens capture', async () => {
  let release;
  const h = transportHarness({ token: new Promise(resolve => { release = resolve; }) });
  const starting = h.start(); h.abort.abort(); release({ value: 'fixture' });
  await assert.rejects(starting, { name: 'AbortError' });
  assert.deepEqual(h.counts(), { trackStops: 0, peerCloses: 0, channelCloses: 0 });
});

test('data channel opening has a bounded timeout and cleans up on abort', async () => {
  for (const cancel of [false, true]) {
    const h = transportHarness({ open: false });
    const starting = h.start();
    if (cancel) { await pause(10); h.abort.abort(); }
    await assert.rejects(starting, cancel ? { name: 'AbortError' } : /Timed out opening/);
    assert.deepEqual(h.counts(), { trackStops: 1, peerCloses: 1, channelCloses: 1 });
  }
});

test('finalization failure retains confirmed text and marks the saved result as errored', async () => {
  const h = controllerHarness(); await h.controller().start();
  h.events().onEvent(final('a', 'Confirmed.'));
  h.events().onEvent(delta('b', 'Not confirmed'));
  h.setStop(async () => { throw new Error('Timed out waiting for the final transcription'); });
  await h.controller().stop();
  assert.equal(h.stored.get('item-1').text, 'Confirmed.');
  assert.equal(h.stored.get('item-1').response.body.status, 'error');
  assert.equal(h.state.realtimeText, 'Confirmed.');
  assert.equal(h.state.realtimeStatus, 'error');
  assert.equal(h.alerts.length, 1); assert.deepEqual(h.deleted, []); h.unmount();
});

test('save failures are visible without deleting the transcript or losing the final screen text', async () => {
  const h = controllerHarness({ saveError: 'Storage quota exceeded' }); await h.controller().start();
  h.events().onEvent(final('a', 'Keep this text.')); await h.controller().stop();
  assert.equal(h.state.realtimeStatus, 'error');
  assert.equal(h.state.realtimeText, 'Keep this text.');
  assert.ok(h.alerts.some(message => message.includes('Storage quota exceeded')));
  assert.deepEqual(h.deleted, []); h.unmount();
});

test('silent sessions are removed, and duplicate Stop does not clear a completed transcript', async () => {
  const h = controllerHarness(); await h.controller().start();
  await Promise.all([h.controller().stop(), h.controller().stop()]);
  assert.equal(h.stopped(), 1); assert.deepEqual(h.deleted, ['item-1']);
  await h.controller().start(); h.events().onEvent(final('a', 'Keep visible.'));
  await h.controller().stop(); await h.controller().stop();
  assert.equal(h.state.realtimeText, 'Keep visible.'); h.unmount();
});

test('model changes and storage rerenders do not change the active session save owner', async () => {
  const h = controllerHarness(); await h.controller().start();
  h.events().onEvent(final('a', 'Original model.'));
  h.selectModel('google/gemini-live'); h.replaceContext();
  await h.controller().stop();
  assert.equal(h.stored.get('item-1').response.modelId, 'openai/gpt-transcribe');
  assert.equal(h.state.realtimeText, 'Original model.');
  assert.equal(h.stopped(), 1); assert.deepEqual(h.alerts, []); h.unmount();
});

test('unmount finalizes a connected session and cancellation rejects stale startup callbacks', async () => {
  const active = controllerHarness(); await active.controller().start();
  active.setStop(async events => { await pause(5); events.onEvent(final('a', 'Saved on navigation.')); });
  active.unmount(); await pause(30);
  assert.equal(active.stored.get('item-1').text, 'Saved on navigation.');
  assert.equal(active.stopped(), 1);
  const pending = controllerHarness({ pendingSetup: true });
  const starting = pending.controller().start(); await pause(10);
  pending.unmount(); pending.releaseSetup(); await starting;
  pending.events().onEvent(final('late', 'Discard'));
  assert.equal(pending.stopped(), 1); assert.deepEqual([...pending.stored.values()], []);
  assert.deepEqual(pending.alerts, []);
});

test('the real OpenAI transport and controller save a final transcript that a fresh history store can reload', async () => {
  let database;
  const { IndexedDBTranscriptionStore } = load(path.resolve(__dirname,
    '../packages/aihappey-transcriptions/src/stores/IndexedDBTranscriptionStore.ts'), {
    'idb-keyval': { get: async () => structuredClone(database), set: async (_key, value) => { await pause(5); database = structuredClone(value); } },
  }, { window: {} });
  const transport = transportHarness();
  const h = controllerHarness({ transport, durableStore: new IndexedDBTranscriptionStore() });
  await h.controller().start();
  transport.dc.emit({ type: 'session.created', session: { type: 'transcription', id: 'session-fixture' } });
  transport.dc.emit({ type: 'input_audio_buffer.speech_started', item_id: 'a', audio_start_ms: 500 });
  transport.dc.emit(delta('a', 'Provisional'));
  transport.dc.onSend = () => {
    transport.dc.emit({ type: 'input_audio_buffer.committed', item_id: 'a' });
    transport.dc.emit({ type: 'input_audio_buffer.speech_stopped', item_id: 'a', audio_end_ms: 2500 });
    setTimeout(() => transport.dc.emit(final('a', 'Durable final.')), 10);
  };
  await h.controller().stop();
  const reloaded = await new IndexedDBTranscriptionStore().list();
  assert.equal(reloaded.length, 1);
  assert.equal(reloaded[0].transcription.text, 'Durable final.');
  assert.equal(reloaded[0].transcription.response.body.status, 'completed');
  assert.equal(reloaded[0].transcription.response.body.session.id, 'session-fixture');
  assert.deepEqual(reloaded[0].transcription.segments, [{ text: 'Durable final.', startSecond: 0.5, endSecond: 2.5 }]);
  assert.equal(h.state.realtimeText, 'Durable final.');
  assert.deepEqual(h.alerts, []); h.unmount();
});

test('failed startup removes an empty placeholder and retains its error state', async () => {
  const h = controllerHarness({ setupError: 'Could not connect' }); await h.controller().start();
  assert.deepEqual(h.deleted, ['item-1']);
  assert.equal(h.state.realtimeStatus, 'error');
  assert.ok(h.alerts.some(message => message.includes('Could not connect'))); h.unmount();
});

test('Stop during startup never deletes confirmed text already received', async () => {
  const h = controllerHarness({ pendingSetup: true });
  const starting = h.controller().start(); await pause(10);
  h.events().onEvent(final('a', 'Confirmed during startup.'));
  await h.controller().stop(); h.releaseSetup(); await starting;
  assert.equal(h.stored.get('item-1').text, 'Confirmed during startup.');
  assert.deepEqual(h.deleted, []); assert.deepEqual(h.alerts, []); h.unmount();
});

test('callbacks after transport finalization cannot enqueue writes behind the completed checkpoint', async () => {
  const h = controllerHarness({ slowSave: true }); await h.controller().start();
  h.events().onEvent(final('a', 'Original final.'));
  const stopping = h.controller().stop(); await pause(10);
  h.events().onEvent(final('late', 'Must be ignored.'));
  h.events().onError('Late disconnect');
  h.releaseSave(); await stopping;
  assert.equal(h.writes.at(-1).text, 'Original final.');
  assert.equal(h.writes.at(-1).response.body.status, 'completed');
  assert.deepEqual(h.alerts, []); h.unmount();
});

test('a fatal error followed by Stop during startup checkpoints the confirmed result', async () => {
  const h = controllerHarness({ pendingSetup: true });
  const starting = h.controller().start(); await pause(10);
  h.events().onEvent(final('a', 'Keep startup text.'));
  h.events().onError('Startup disconnected');
  await h.controller().stop(); h.releaseSetup(); await starting;
  assert.equal(h.stored.get('item-1').text, 'Keep startup text.');
  assert.equal(h.stored.get('item-1').response.body.status, 'error');
  assert.equal(h.state.realtimeStatus, 'error');
  assert.deepEqual(h.deleted, []); h.unmount();
});

test('provider errors during Stop reject finalization instead of being swallowed as local closure', async () => {
  const h = transportHarness(), session = await h.start();
  h.dc.emit({ type: 'input_audio_buffer.speech_started', item_id: 'a' });
  h.dc.onSend = () => h.dc.emit({ type: 'error', error: { code: 'invalid_request', message: 'Provider refused finalization.' } });
  await assert.rejects(session.stop(), /Provider refused finalization/);
  assert.deepEqual(h.errors, []);
  assert.equal(h.counts().trackStops, 1);
});

test('the transport also waits for readiness and shuts down normally without a cancellation signal', async () => {
  const h = transportHarness(); const session = await h.start({ signal: undefined });
  await session.stop(); assert.deepEqual(h.errors, []);
  assert.equal(h.counts().trackStops, 1);
});
