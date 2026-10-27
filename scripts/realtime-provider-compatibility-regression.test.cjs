const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = 'packages/aihappey-core/src/features/realtime/';
function load(file, mocks = {}, globals = {}) {
  const source = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', ...Object.keys(globals), code)(id => {
    if (id in mocks) return mocks[id];
    if (id.startsWith('.')) return load(path.join(path.dirname(file), id + '.ts'), mocks, globals);
    throw new Error('Unmocked import: ' + id);
  }, module, module.exports, ...Object.values(globals));
  return module.exports;
}

test('SpaceX AI and xAI aliases share lookup, startup and session updates without rewriting model identity', async () => {
  const mocks = {};
  const calls = [];
  const providers = [
    ['openAi', 'openai'], ['xAi', 'xai'], ['assemblyAi', 'assemblyai'],
    ['agentPhone', 'agentphone'], ['google', 'google'], ['cartesia', 'cartesia'], ['opperAi', 'opperai'],
  ];
  for (const [name, id] of providers) {
    mocks[`./${name}RealtimeConversationProvider`] = {
      [`${name}RealtimeConversationProvider`]: {
        start: async args => { calls.push(args); return { provider: id }; },
        createSessionUpdateEvent: args => ({ provider: id, model: args.model }),
      },
    };
  }
  const registry = load(root + 'realtimeConversationProviders.ts', mocks);
  const runtime = registry.getRealtimeConversationProvider('xai');
  for (const name of ['xai', 'spacexai', 'SpaceXAI', 'XAI']) {
    const args = { model: `${name}/grok-voice-think-fast`, config: {} };
    assert.equal(registry.parseRealtimeProviderIdFromModelId(args.model), 'xai');
    assert.equal(registry.getRealtimeConversationProvider(name), runtime);
    assert.deepEqual(await registry.startRealtimeConversationProviderSession(args), { provider: 'xai' });
    assert.equal(calls.at(-1), args);
    assert.deepEqual(registry.buildRealtimeConversationSessionUpdateEvent(args), { provider: 'xai', model: args.model });
  }
  for (const [, id] of providers) assert.equal((await registry.startRealtimeConversationProviderSession({ model: `${id}/model` })).provider, id);
  await assert.rejects(registry.startRealtimeConversationProviderSession({ model: 'unsupported/model' }), /not supported/);
  await assert.rejects(registry.startRealtimeConversationProviderSession({ model: 'no-prefix' }), /provider prefix/);
});

function xaiHarness() {
  const requests = [], headers = [], connections = [];
  const runtime = load(root + 'xAiRealtimeConversationProvider.ts', {
    'aihappey-ai': {
      getRealtimeToken: async config => async request => {
        requests.push({ config, request });
        return { value: 'ephemeral-test-token' };
      },
    },
    '../provider-credentials/scopedRequest': {
      buildOperationHeaders: async (...args) => { headers.push(args); return { 'x-selected-provider-key': 'test-key' }; },
    },
    './realtimeMessageParts': {
      stripProviderPrefix: model => model.slice(model.indexOf('/') + 1),
      mcpToolToRealtimeFunctionTool: tool => ({ ...tool, type: 'function' }),
    },
    './startXAiRealtimeConversationWs': {
      startXAiRealtimeConversationWsSession: async args => {
        connections.push(args);
        await args.getEphemeralToken();
        return { kind: 'ws' };
      },
    },
  });
  return { ...runtime, requests, headers, connections };
}

test('xAI runtime reads legacy SpaceX AI settings and retains original secrets routing and options', async () => {
  const h = xaiHarness();
  const metadata = { spacexai: { voice: 'legacy-voice', expires_after: { seconds: 120 }, session: { turn_detection: null } } };
  const args = {
    model: 'spacexai/grok-voice-think-fast',
    config: { baseUrl: 'https://backend.test', endpoints: { realtime: '/v1/realtime/client_secrets' } },
    customHeaders: { 'x-custom': 'value' },
    providerRealtimeConversationMetadata: metadata,
    providerMetadata: { spacexai: { instructions: 'Legacy chat instructions' } },
  };
  await h.xAiRealtimeConversationProvider.start(args);
  assert.equal(h.headers[0][2], args.model);
  assert.equal(h.headers[0][1], args.customHeaders);
  assert.equal(h.requests[0].config.baseUrl, 'https://backend.test/v1/realtime/client_secrets');
  assert.equal(h.requests[0].request.model, args.model);
  const options = h.requests[0].request.providerOptions;
  assert.equal(options.xai.voice, 'legacy-voice');
  assert.equal(options.xai.expires_after.seconds, 120);
  assert.equal(options.xai.session.instructions, 'Legacy chat instructions');
  assert.equal(options.xai.session.turn_detection, null);
  assert.equal(options.spacexai, metadata.spacexai);
  assert.equal(h.connections[0].model, 'grok-voice-think-fast');
  assert.equal(h.connections[0].session, options.xai.session);
  assert.deepEqual(metadata.spacexai.session, { turn_detection: null });
});

test('canonical xAI settings take precedence over legacy SpaceX AI settings in startup and updates', async () => {
  const h = xaiHarness();
  const args = {
    model: 'xai/grok-voice',
    providerRealtimeConversationMetadata: { xai: { voice: 'new-voice' }, spacexai: { voice: 'old-voice' } },
    providerMetadata: { xai: { instructions: 'New instructions' }, spacexai: { instructions: 'Old instructions' } },
  };
  const config = h.buildXAiRealtimeSessionConfig(args);
  assert.equal(config.voice, 'new-voice');
  assert.equal(config.instructions, 'New instructions');
  assert.deepEqual(h.xAiRealtimeConversationProvider.createSessionUpdateEvent(args), { type: 'session.update', session: config });
  assert.equal(h.buildXAiRealtimeSessionConfig({ ...args, instructions: 'Explicit instructions' }).instructions, 'Explicit instructions');
  assert.equal(h.buildXAiRealtimeSessionConfig({ model: args.model }).voice, 'eve');
});

const flush = () => new Promise(resolve => setImmediate(resolve));
function googleHarness(options = {}) {
  const sockets = [], errors = [], events = [], contexts = [], timers = new Map();
  let nextTimer = 0, microphoneRequests = 0, opened = 0, trackStopped = false;
  class FakeWebSocket {
    static OPEN = 1;
    constructor(url) {
      if (options.constructorError) throw new Error(`Connection refused: ${url}`);
      this.url = url;
      this.readyState = 0;
      this.listeners = new Map();
      this.sent = [];
      this.closeCalls = 0;
      sockets.push(this);
    }
    addEventListener(type, callback) {
      if (!this.listeners.has(type)) this.listeners.set(type, new Set());
      this.listeners.get(type).add(callback);
    }
    removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
    emit(type, event = {}) { for (const callback of [...(this.listeners.get(type) ?? [])]) callback(event); }
    open() { this.readyState = 1; this.emit('open'); }
    message(message) { this.emit('message', { data: typeof message === 'string' ? message : JSON.stringify(message) }); }
    send(message) {
      if (options.sendError) throw new Error('Setup send failed');
      this.sent.push(JSON.parse(message));
    }
    close(code = 1000, reason = '') {
      this.closeCalls++;
      this.readyState = 3;
      this.emit('close', { code, reason, wasClean: code === 1000 });
    }
    listenerCount() { return [...this.listeners.values()].reduce((count, listeners) => count + listeners.size, 0); }
  }
  const node = () => ({ connect() {}, disconnect() {} });
  class FakeAudioContext {
    constructor() {
      if (options.audioContextError) throw new Error('Audio initialization failed');
      this.sampleRate = 48000;
      this.currentTime = 0;
      this.destination = {};
      this.closed = false;
      contexts.push(this);
    }
    createMediaStreamSource() { return node(); }
    createScriptProcessor() { return node(); }
    createGain() { return { ...node(), gain: { value: 1 } }; }
    async close() { this.closed = true; }
  }
  const { startGoogleRealtimeConversationWsSession } = load(root + 'startGoogleRealtimeConversationWs.ts', {}, {
    WebSocket: FakeWebSocket,
    window: { AudioContext: FakeAudioContext },
    navigator: { mediaDevices: { getUserMedia: async () => {
      microphoneRequests++;
      if (options.microphoneError) throw new Error('Microphone permission denied');
      const track = { stop: () => { trackStopped = true; } };
      return { getTracks: () => [track], getAudioTracks: () => [track] };
    } } },
    setTimeout: (callback, ms) => { const id = ++nextTimer; timers.set(id, { callback, ms }); return id; },
    clearTimeout: id => timers.delete(id),
  });
  const args = {
    setup: { model: 'models/gemini-live-test', generationConfig: { responseModalities: ['AUDIO'] }, sessionResumption: {} },
    getEphemeralToken: async () => ({ value: 'auth_tokens/test-SECRET' }),
    events: { onError: (...args) => errors.push(args), onEvent: event => events.push(event), onOpen: () => { opened++; } },
  };
  return {
    args, sockets, errors, events, timers, contexts,
    start: () => startGoogleRealtimeConversationWsSession(args),
    runTimers: ms => {
      for (const [id, timer] of [...timers]) if (timer.ms === ms) { timers.delete(id); timer.callback(); }
    },
    get microphoneRequests() { return microphoneRequests; },
    get trackStopped() { return trackStopped; },
    get opened() { return opened; },
  };
}

test('Google waits for setupComplete before requesting microphone access and retains constrained ephemeral authentication', async () => {
  const h = googleHarness();
  const pending = h.start();
  await flush();
  const ws = h.sockets[0];
  const url = new URL(ws.url);
  assert.match(url.pathname, /v1alpha.*BidiGenerateContentConstrained$/);
  assert.equal(url.searchParams.get('access_token'), 'auth_tokens/test-SECRET');
  assert.equal(h.microphoneRequests, 0);
  ws.open();
  assert.deepEqual(ws.sent, [{ setup: h.args.setup }]);
  assert.equal(h.microphoneRequests, 0);
  ws.message({ setupComplete: {} });
  const session = await pending;
  assert.equal(session.ws, ws);
  assert.equal(h.microphoneRequests, 1);
  assert.equal([...h.timers.values()].some(timer => timer.ms === 30000), false);
  h.runTimers(0);
  assert.equal(h.opened, 1);
  await session.stop();
  await flush();
  assert.equal(h.trackStopped, true);
  assert.equal(h.contexts[0].closed, true);
  assert.equal(ws.listenerCount(), 0);
  assert.deepEqual(h.errors, []);
});

test('Google setup close reports code, reason, model and stage without duplicate callback errors', async () => {
  const h = googleHarness();
  const rejection = assert.rejects(h.start(), error => {
    assert.match(error.message, /code 1008/);
    assert.match(error.message, /Unsupported model or setup field/);
    assert.match(error.message, /models\/gemini-live-test/);
    assert.match(error.message, /stage: waiting for setupComplete/);
    return true;
  });
  await flush();
  const ws = h.sockets[0];
  ws.open();
  ws.close(1008, 'Unsupported model or setup field');
  await rejection;
  assert.equal(h.microphoneRequests, 0);
  assert.equal(ws.listenerCount(), 0);
  assert.equal(h.timers.size, 0);
  assert.deepEqual(h.errors, []);
});

for (const binary of [false, true]) {
  test(`Google preserves ${binary ? 'binary' : 'text'} server error before an immediate generic close`, async () => {
    const h = googleHarness();
    const rejection = assert.rejects(h.start(), error => {
      assert.match(error.message, /INVALID_ARGUMENT, 400/);
      assert.match(error.message, /Invalid generationConfig/);
      assert.doesNotMatch(error.message, /closed before setup completed/);
      return true;
    });
    await flush();
    const ws = h.sockets[0];
    ws.open();
    const frame = JSON.stringify({ error: { code: 400, status: 'INVALID_ARGUMENT', message: 'Invalid generationConfig' } });
    ws.emit('message', { data: binary ? new TextEncoder().encode(frame).buffer : frame });
    ws.close(1008);
    await rejection;
    assert.equal(h.microphoneRequests, 0);
    assert.equal(ws.listenerCount(), 0);
    assert.deepEqual(h.errors, []);
  });
}

test('Google waits for an asynchronously decoded Blob error before reporting its following close', async () => {
  const h = googleHarness();
  const rejection = assert.rejects(h.start(), /Slowly decoded server rejection/);
  await flush();
  const ws = h.sockets[0];
  ws.open();
  let release;
  class DelayedBlob extends Blob { text() { return new Promise(resolve => { release = resolve; }); } }
  ws.emit('message', { data: new DelayedBlob() });
  await flush();
  ws.close(1008);
  release(JSON.stringify({ error: { message: 'Slowly decoded server rejection' } }));
  await rejection;
  assert.deepEqual(h.errors, []);
});

test('Google opaque transport error waits for useful close details rather than overwriting them', async () => {
  const h = googleHarness();
  const rejection = assert.rejects(h.start(), /code 1006.*no close reason supplied.*browser did not disclose.*opening WebSocket/);
  await flush();
  h.sockets[0].emit('error', { target: h.sockets[0] });
  h.sockets[0].close(1006);
  await rejection;
  assert.deepEqual(h.errors, []);
});

for (const open of [false, true]) {
  test(`Google setup timeout cleans up while ${open ? 'awaiting setupComplete' : 'opening the socket'}`, async () => {
    const h = googleHarness();
    const rejection = assert.rejects(h.start(), /setup timed out after 30s/);
    await flush();
    const ws = h.sockets[0];
    if (open) ws.open();
    else ws.emit('error');
    h.runTimers(30000);
    await rejection;
    assert.equal(ws.closeCalls, 1);
    assert.equal(ws.listenerCount(), 0);
    assert.equal(h.timers.size, 0);
    assert.equal(h.microphoneRequests, 0);
    ws.open();
    ws.message({ setupComplete: {} });
    await flush();
    assert.equal(h.microphoneRequests, 0);
    assert.deepEqual(h.errors, []);
  });
}

for (const source of ['close', 'server', 'constructor', 'invalid-json']) {
  test(`Google ${source} diagnostics redact tokens and URL credentials`, async () => {
    const h = googleHarness({ constructorError: source === 'constructor' });
    const rejection = assert.rejects(h.start(), error => {
      assert.doesNotMatch(error.message, /test-SECRET|auth_tokens|auth_tokens%2F|other-SECRET/);
      assert.doesNotMatch(error.message, /[?&](?:key|access_token)=/);
      return true;
    });
    await flush();
    if (source !== 'constructor') {
      const ws = h.sockets[0];
      ws.open();
      const detail = `Token auth_tokens/test-SECRET auth_tokens%2Ftest-SECRET rejected at https://example.test/live?key=other-SECRET&access_token=auth_tokens%2Ftest-SECRET`;
      if (source === 'close') ws.close(1008, detail);
      else if (source === 'server') ws.message({ error: { code: 401, message: detail } });
      else ws.message('Malformed JSON including auth_tokens/test-SECRET');
    }
    await rejection;
    assert.deepEqual(h.errors, []);
    assert.doesNotMatch(JSON.stringify(h.events), /SECRET/);
  });
}

test('Google setup send failure rejects immediately and cleans up', async () => {
  const h = googleHarness({ sendError: true });
  const rejection = assert.rejects(h.start(), /failed to send setup: Setup send failed.*sending setup/);
  await flush();
  h.sockets[0].open();
  await rejection;
  assert.equal(h.sockets[0].listenerCount(), 0);
  assert.equal(h.timers.size, 0);
});

for (const options of [{ microphoneError: true }, { audioContextError: true }]) {
  test(`Google cleans up its connection after ${options.microphoneError ? 'microphone permission' : 'audio initialization'} failure`, async () => {
    const h = googleHarness(options);
    const rejection = assert.rejects(h.start(), /Google Live microphone startup failed/);
    await flush();
    const ws = h.sockets[0];
    ws.open();
    ws.message({ setupComplete: {} });
    await rejection;
    await flush();
    assert.equal(ws.closeCalls, 1);
    assert.equal(ws.listenerCount(), 0);
    assert.equal(h.trackStopped, !!options.audioContextError);
    assert.equal(h.timers.size, 0);
    assert.deepEqual(h.errors, []);
  });
}

test('Google connected server errors retain detail and do not get replaced by a generic close', async () => {
  const h = googleHarness();
  const pending = h.start();
  await flush();
  const ws = h.sockets[0];
  ws.open();
  ws.message({ setupComplete: {} });
  const session = await pending;
  ws.message({ error: { status: 'RESOURCE_EXHAUSTED', code: 429, message: 'Quota exhausted for auth_tokens/test-SECRET' } });
  ws.close(1011);
  await flush();
  assert.equal(h.errors.length, 1);
  assert.equal(h.errors[0].length, 1); // No raw Error/Event object appended by the controller.
  assert.match(h.errors[0][0], /RESOURCE_EXHAUSTED, 429.*Quota exhausted/);
  assert.doesNotMatch(h.errors[0][0], /SECRET/);
  await session.stop();
});

test('Google reports unexpected connected close details when no resumption handle is available', async () => {
  const h = googleHarness();
  const pending = h.start();
  await flush();
  const ws = h.sockets[0];
  ws.open();
  ws.message({ setupComplete: {} });
  const session = await pending;
  ws.close(1011, 'Service unavailable');
  await flush();
  assert.equal(h.errors.length, 1);
  assert.match(h.errors[0][0], /code 1011.*Service unavailable.*stage: connected/);
  await session.stop();
});

test('Google successful session resumption still replaces the socket without reporting an intentional close', async () => {
  const h = googleHarness();
  const pending = h.start();
  await flush();
  const first = h.sockets[0];
  first.open();
  first.message({ setupComplete: {} });
  const session = await pending;
  first.message({ sessionResumptionUpdate: { resumable: true, newHandle: 'resume-handle' } });
  first.message({ goAway: { timeLeft: '10s' } });
  await flush();
  assert.equal(h.sockets.length, 2);
  const replacement = h.sockets[1];
  replacement.open();
  assert.equal(replacement.sent[0].setup.sessionResumption.handle, 'resume-handle');
  replacement.message({ setupComplete: {} });
  await flush();
  assert.equal(session.ws, replacement);
  assert.equal(first.closeCalls, 1);
  assert.deepEqual(h.errors, []);
  assert.ok(h.events.some(event => event.type === 'session.resumed'));
  await session.stop();
});
