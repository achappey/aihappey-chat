const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const feature = 'packages/aihappey-core/src/features/realtime/';
function load(name, mocks, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, feature, name), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', ...Object.keys(globals), code)(id => {
    if (id in mocks) return mocks[id];
    throw new Error('Unmocked import: ' + id);
  }, module, module.exports, ...Object.values(globals));
  return module.exports;
}
const token = () => ({ session_id: 'session-fixture', transport: 'livekit', token: 'ephemeral-fixture',
  livekit_url: 'wss://room.test', expires_at: '2099-01-01T00:00:00Z', max_duration_seconds: 1800 });
const tick = () => new Promise(resolve => setTimeout(resolve, 5));
function harness(startup) {
  const calls = [], events = []; let options;
  const client = { end: async () => calls.push('end'), startAudio: async () => calls.push('audio'),
    setMicMuted: async muted => calls.push(['muted', muted]), interrupt: () => calls.push('interrupt'),
    sendUserActivity: () => calls.push('activity'), sendUserMessage: (...args) => calls.push(['text', ...args]) };
  const start = async value => { options = value; if (startup) await startup(value, client); return client; };
  const api = load('fishAudioSession.ts', { '@fishaudio/agent-client': { AgentSession: { start } } });
  return { ...api, calls, events, client, get options() { return options; }, args: { sessionToken: token(),
    onEvent: event => events.push(event), onOpen: () => calls.push('open') } };
}

test('Fish Audio validates the discriminated SDK token without inventing defaults or rewriting it', () => {
  const h = harness(); const value = token(); assert.equal(h.validateFishSessionToken(value), value);
  for (const patch of [{ transport: 'future' }, { expires_at: 'invalid' }, { expires_at: '2000-01-01' },
    { livekit_url: 'http://unsafe.test' }, { token: '' }, { max_duration_seconds: 0 }])
    assert.throws(() => h.validateFishSessionToken({ ...token(), ...patch }));
});

test('startup callbacks preserve cumulative segments, avoid message echoes, and run after owner installation', async () => {
  const h = harness(options => {
    options.callbacks.onUserTranscript({ segmentId: 'user', text: 'Hel', final: false });
    options.callbacks.onUserTranscript({ segmentId: 'user', text: 'Hello', final: true });
    options.callbacks.onAgentResponseDelta({ segmentId: 'agent', delta: 'Hi', text: 'Hi' });
    options.callbacks.onAgentResponse({ segmentId: 'agent', text: 'Hi' });
  });
  const session = await h.startFishAudioSession(h.args);
  assert.equal(h.events.length, 0); assert.equal(h.options.callbacks.onMessage, undefined);
  await tick();
  assert.deepEqual(h.events.map(event => [event.type, event.item_id, event.text]), [
    ['transcript.user.delta', 'user', 'Hel'], ['transcript.user', 'user', 'Hello'],
    ['transcript.agent.delta', 'agent', 'Hi'], ['transcript.agent', 'agent', 'Hi'],
  ]);
  session.send({ type: 'conversation.item.create', item: { role: 'user', content: [{ type: 'input_text', text: 'Hello' }] } });
  assert.deepEqual(h.calls.at(-1), ['text', 'Hello', { audio: true }]);
  const before = h.calls.length; session.send({ type: 'response.create' }); assert.equal(h.calls.length, before);
  assert.throws(() => session.send({ type: 'conversation.item.create', item: { role: 'user', content: [{ type: 'input_image' }] } }), /text input/);
  session.send({ type: 'response.cancel' }); assert.equal(h.calls.at(-1), 'interrupt');
  session.send({ type: 'user.activity' }); assert.equal(h.calls.at(-1), 'activity');
  await session.setMuted(true); assert.deepEqual(h.calls.at(-1), ['muted', true]);
  await Promise.all([session.stop(), session.stop()]); assert.equal(h.calls.filter(call => call === 'end').length, 1);
});

test('only selected client tools are registered and results flow through the existing approval adapter', async () => {
  const h = harness(); const session = await h.startFishAudioSession({ ...h.args, toolNames: ['approved_tool'] }); await tick();
  assert.deepEqual(Object.keys(h.options.clientTools), ['approved_tool']);
  const result = h.options.clientTools.approved_tool({ query: 'fixture' }, { callId: 'call-1' });
  assert.equal(h.events.at(-1).item.call_id, 'call-1');
  assert.equal(h.events.at(-1).type, 'response.output_item.done');
  session.send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: 'call-1', output: '{"ok":true}' } });
  assert.deepEqual(await result, { ok: true });
  session.send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: 'call-1', output: '{}' } }); // stale result ignored
  const denied = h.options.clientTools.approved_tool({}, { callId: 'call-2' });
  const rejected = assert.rejects(denied, /not approved/);
  session.send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: 'call-2', output: '{"isError":true}' } });
  await rejected;
  const pending = h.options.clientTools.approved_tool({}, { callId: 'call-3' });
  const cancelled = assert.rejects(pending, /session ended/); await session.stop(); await cancelled;
});

test('abort during SDK startup tears down the late connection and suppresses stale callbacks', async () => {
  let release; const wait = new Promise(resolve => release = resolve);
  const h = harness(() => wait); const abort = new AbortController();
  const starting = h.startFishAudioSession({ ...h.args, signal: abort.signal }); abort.abort(); release();
  await assert.rejects(starting, { name: 'AbortError' }); await tick();
  assert.equal(h.calls.filter(call => call === 'end').length, 1); assert.equal(h.events.length, 0);
});

test('reconnect/end signals preserve reasons without re-creating sessions and SDK causes are sanitized', async () => {
  const h = harness(); const session = await h.startFishAudioSession(h.args); await tick();
  h.options.callbacks.onStatusChange('reconnecting'); h.options.callbacks.onStatusChange('connected');
  h.options.callbacks.onDisconnect({ reason: 'conversation_timeout' });
  assert.deepEqual(h.events.slice(-3).map(event => event.type), ['session.reconnecting', 'session.resumed', 'fishaudio.session.closed']);
  assert.equal(h.events.at(-1).reason, 'conversation_timeout'); await session.stop();
  const failure = harness(() => { throw new Error('wss://room.test?token=private-secret'); });
  await assert.rejects(failure.startFishAudioSession(failure.args), error => !error.message.includes('private-secret') && /connection failed/.test(error.message));
});

test('native bridge validates nonce, version, monotonic IDs, command allowlist and late-session rejection', async () => {
  let receive; const posts = [], commands = [];
  const nonce = 'a'.repeat(32);
  const client = { send: data => commands.push(data), setMuted: async () => {}, stop: async () => commands.push('stop') };
  load('fishAudioDesktopBridge.ts', { './fishAudioSession': { startFishAudioSession: async () => client } }, {
    window: { chrome: { webview: { postMessage: data => posts.push(data), addEventListener: (_, handler) => receive = handler } } },
    location: { hash: '#' + nonce },
  });
  assert.equal(posts[0].kind, 'ready');
  const send = (id, command, payload, extra = {}) => receive({ data: { version: 1, nonce, id, command, payload, ...extra } });
  await send(1, 'start', {}, { nonce: 'bad' }); assert.equal(posts.length, 1);
  await send(1, 'start', { sessionToken: token() }); assert.equal(posts.at(-1).ok, true);
  await send(1, 'send', { type: 'user.interrupt' }); assert.equal(commands.length, 0);
  await send(2, 'eval', { script: 'arbitrary' }); assert.equal(posts.at(-1).ok, false);
  await send(3, 'send', { type: 'user.interrupt' }); assert.equal(commands.length, 1);
  await send(4, 'stop'); assert.equal(commands.at(-1), 'stop');
  await send(5, 'send', {}); assert.equal(posts.at(-1).ok, false);
});

test('bundled Windows runtime matches shared sources and has no embedded web presentation or script bridge', () => {
  const assets = path.resolve(root, '../aihappey-desktop/Core/AIHappey.Desktop.Core/Assets/FishAudio');
  const manifest = JSON.parse(fs.readFileSync(path.join(assets, 'manifest.json')));
  const sha = data => crypto.createHash('sha256').update(data).digest('hex');
  assert.equal(manifest.sdk, '0.3.0');
  for (const [name, hash] of Object.entries(manifest.sources)) assert.equal(sha(fs.readFileSync(path.join(root, feature, name))), hash, 'Rebuild the shared Windows transport bundle.');
  assert.equal(sha(fs.readFileSync(path.join(assets, 'runtime.js'))), manifest.bundle);
  assert.match(fs.readFileSync(path.join(assets, 'index.html'), 'utf8'), /<body><\/body>/);
  const native = fs.readFileSync(path.resolve(assets, '../../FishAudioRealtimeSession.cs'), 'utf8');
  assert.match(native, /controller.IsVisible = false/); assert.match(native, /AreHostObjectsAllowed = false/);
  assert.doesNotMatch(native, /ExecuteScriptAsync|AddHostObjectToScript|new WebView2\(/);
});
