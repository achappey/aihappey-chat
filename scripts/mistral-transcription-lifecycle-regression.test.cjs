const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { renderer } = require('./react-test-renderer.cjs');

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

function harness({ pendingSetup = false } = {}) {
  const view = renderer();
  let controller, events, signal, stopped = 0, connections = 0, releaseSetup, mounted = true;
  const setup = new Promise(resolve => { releaseSetup = resolve; });
  const writes = [], alerts = [];
  const state = { customHeaders: {}, providerRealtimeMetadata: {},
    setRealtimeSessionState(patch) { Object.assign(state, patch); },
    resetRealtimeSessionState() { state.realtimeStatus = 'idle'; } };
  const args = { config: { baseUrl: 'https://gateway/', endpoints: { realtime: 'token' } },
    selectedModel: { id: 'mistral/voxtral-mini-transcribe-realtime-3', tags: ['real-time'] },
    onErrorAlert: message => alerts.push(message) };
  const store = {
    async add() { replaceContext(); return { id: 'item' }; },
    async update(id, patch) { writes.push(structuredClone(patch.transcription)); replaceContext(); },
    async delete() { replaceContext(); },
  };
  function replaceContext() {
    // Production replaces the context on every add/update, recreating its methods.
    args.transcriptions = { ...store, items: [], update: (...params) => store.update(...params) };
    if (mounted) render();
  }
  const mocks = {
    react: view.react,
    'aihappey-state': { useAppStore: select => select(state) },
    'aihappey-i18n': { useTranslation: () => ({ t: text => text }) },
    'aihappey-ai': { getRealtimeToken: async () => async () => ({ value: 'rt_fixture' }) },
    '../../provider-credentials/scopedRequest': { buildOperationHeaders: async () => ({}) },
    './startRealtimeWebrtcSession': { startRealtimeWebrtcSession: async options => {
      connections++; events = options.events; signal = options.signal;
      events.onSessionCreated({ provider: 'mistral' });
      if (pendingSetup) await setup; // Also exercise transports that finish after cancellation.
      return { kind: 'ws', stop: async () => {
        stopped++;
        events.onEvent({ type: 'transcription.done', text: 'Hello world.' });
      } };
    } },
    './realtimeProviders': { parseProviderIdFromModelId: id => id.split('/')[0] },
    '../transcriptionErrors': { getTranscriptionErrorMessage: error => String(error) },
    '../../realtime/googleLiveConfig': { buildGoogleLiveTokenPayload: () => ({}) },
  };
  const file = path.resolve(__dirname, '../packages/aihappey-core/src/features/transcriptions/realtime/useRealtimeTranscriptionController.ts');
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    assert.ok(id in mocks, id); return mocks[id];
  }, module, module.exports);
  function Component() { controller = module.exports.useRealtimeTranscriptionController(args); return null; }
  function Empty() { return null; }
  function render() { view.render(Component, {}); }
  replaceContext();
  return { controller: () => controller, render, replaceContext, writes, alerts, state,
    events: () => events, signal: () => signal, stopped: () => stopped, connections: () => connections,
    releaseSetup, unmount: () => { mounted = false; view.render(Empty, {}); } };
}

test('storage context replacement and readiness persistence do not stop Mistral capture', async () => {
  const h = harness();
  await h.controller().start();
  await pause(450); // Readiness persistence replaces context and rerenders the hook.
  assert.ok(h.writes.length);
  assert.equal(h.stopped(), 0);
  for (const text of ['Hello', ' world', '.']) h.events().onEvent({ type: 'transcription.text.delta', text });
  await pause(20);
  h.replaceContext(); h.render();
  assert.equal(h.stopped(), 0);
  await h.controller().stop();
  assert.equal(h.stopped(), 1);
  assert.equal(h.writes.at(-1).text, 'Hello world.');
  assert.deepEqual(h.alerts, []);
  h.unmount();
});

test('actual unmount stops the current session exactly once after rerenders', async () => {
  const h = harness(); await h.controller().start(); h.replaceContext();
  h.unmount(); await pause(20);
  assert.equal(h.stopped(), 1);
  assert.equal(h.writes.at(-1).text, 'Hello world.');
});

test('duplicate starts are ignored and unmount cancels pending setup and releases a late session', async () => {
  const h = harness({ pendingSetup: true });
  const starting = h.controller().start(); await pause(10);
  await h.controller().start();
  assert.equal(h.connections(), 1);
  h.unmount();
  assert.equal(h.signal().aborted, true);
  h.releaseSetup(); await starting; await pause(20);
  assert.equal(h.stopped(), 1);
  assert.notEqual(h.state.realtimeStatus, 'connected');
  assert.deepEqual(h.alerts, []);
});
