const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');

const root = 'packages/aihappey-core/src/features/realtime/';
function load(file, mocks = {}, globals = {}) {
  const source = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, esModuleInterop: true },
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
    ['openAi', 'openai'], ['xAi', 'spacexai'], ['assemblyAi', 'assemblyai'],
    ['agentPhone', 'agentphone'], ['google', 'google'], ['cartesia', 'cartesia'], ['opperAi', 'opperai'],
    ['smallestAi', 'smallestai'], ['fishAudio', 'fishaudio'],
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
    assert.equal(registry.parseRealtimeProviderIdFromModelId(args.model), 'spacexai');
    assert.equal(registry.getRealtimeConversationProvider(name), runtime);
    assert.deepEqual(await registry.startRealtimeConversationProviderSession(args), { provider: 'spacexai' });
    assert.equal(calls.at(-1), args);
    assert.deepEqual(registry.buildRealtimeConversationSessionUpdateEvent(args), { provider: 'spacexai', model: args.model });
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

for (const key of ['spacexai', 'xai']) test(`SpaceX AI secrets use only the official metadata key when reading ${key} settings`, async () => {
  const h = xaiHarness();
  const metadata = { [key]: { voice: 'saved-voice', expires_after: { seconds: 120 }, session: { turn_detection: null } }, google: { keep: true } };
  const args = {
    model: `${key}/grok-voice-think-fast`,
    config: { baseUrl: 'https://backend.test', endpoints: { realtime: '/v1/realtime/client_secrets' } },
    customHeaders: { 'x-custom': 'value' },
    providerRealtimeConversationMetadata: metadata,
    providerMetadata: { [key]: { instructions: 'Saved chat instructions' } },
  };
  await h.xAiRealtimeConversationProvider.start(args);
  assert.equal(h.headers[0][2], args.model);
  assert.equal(h.headers[0][1], args.customHeaders);
  assert.equal(h.requests[0].config.baseUrl, 'https://backend.test/v1/realtime/client_secrets');
  assert.equal(h.requests[0].request.model, args.model);
  const options = h.requests[0].request.providerOptions;
  assert.equal(options.spacexai.voice, 'saved-voice');
  assert.equal(options.spacexai.expires_after.seconds, 120);
  assert.equal(options.spacexai.session.instructions, 'Saved chat instructions');
  assert.equal(options.spacexai.session.turn_detection, null);
  assert.equal(Object.hasOwn(options, 'xai'), false);
  assert.equal(options.google, metadata.google);
  assert.equal(h.connections[0].model, 'grok-voice-think-fast');
  assert.equal(h.connections[0].session, options.spacexai.session);
  assert.deepEqual(metadata[key].session, { turn_detection: null });
});

test('canonical SpaceX AI settings take precedence over legacy xAI settings in startup, secrets and updates', async () => {
  const h = xaiHarness();
  const args = {
    model: 'spacexai/grok-voice',
    config: { baseUrl: '', endpoints: { realtime: '/v1/realtime/client_secrets' } },
    providerRealtimeConversationMetadata: { spacexai: { voice: 'new-voice' }, xai: { voice: 'old-voice' } },
    providerMetadata: { spacexai: { instructions: 'New instructions' }, xai: { instructions: 'Old instructions' } },
  };
  const config = h.buildXAiRealtimeSessionConfig(args);
  assert.equal(config.voice, 'new-voice');
  assert.equal(config.instructions, 'New instructions');
  assert.deepEqual(h.xAiRealtimeConversationProvider.createSessionUpdateEvent(args), { type: 'session.update', session: config });
  await h.xAiRealtimeConversationProvider.start(args);
  assert.equal(h.requests[0].request.providerOptions.spacexai.session.voice, 'new-voice');
  assert.equal(Object.hasOwn(h.requests[0].request.providerOptions, 'xai'), false);
  assert.equal(h.buildXAiRealtimeSessionConfig({ ...args, instructions: 'Explicit instructions' }).instructions, 'Explicit instructions');
  assert.equal(h.buildXAiRealtimeSessionConfig({ model: args.model }).voice, 'eve');
});

test('metadata normalization preserves legacy settings, prefers SpaceX AI and does not mutate other providers', () => {
  const { normalizeSpaceXAiProviderMetadata: normalize } = load('packages/aihappey-state/src/slices/providerMetadataAliases.ts');
  const legacy = { xai: { voice: 'legacy' }, google: { keep: true } };
  assert.deepEqual(normalize(legacy), { spacexai: legacy.xai, google: legacy.google });
  assert.equal(normalize(legacy).google, legacy.google);
  assert.equal(legacy.xai.voice, 'legacy');
  assert.deepEqual(normalize({ ...legacy, spacexai: { voice: 'canonical' } }), { spacexai: { voice: 'canonical' }, google: legacy.google });
  assert.deepEqual(normalize({ ...legacy, spacexai: {} }).spacexai, {});
  for (const invalid of [undefined, null, [], 'invalid']) assert.deepEqual(normalize(invalid), {});
  const { normalizeProviderTranscriptionMetadata } = load('packages/aihappey-state/src/slices/defaultProviderTranscriptionMetadata.ts');
  const transcription = normalizeProviderTranscriptionMetadata(legacy);
  assert.equal(Object.hasOwn(transcription, 'xai'), false);
  assert.deepEqual(transcription.spacexai, legacy.xai);
  assert.equal(transcription.openai.response_format, 'json');
});

test('realtime stores accept old xAI input but keep only canonical SpaceX AI settings', () => {
  const { createRealtimeSlice } = load('packages/aihappey-state/src/slices/realtimeSlice.ts');
  let state;
  state = createRealtimeSlice(patch => { state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) }; }, () => state);
  for (const setter of ['setProviderRealtimeMetadata', 'setProviderRealtimeConversationMetadata']) {
    const field = setter[3].toLowerCase() + setter.slice(4);
    state[setter]({ xai: { voice: 'legacy' }, google: { keep: true } });
    assert.deepEqual(state[field], { spacexai: { voice: 'legacy' }, google: { keep: true } });
  }
});

test('persisted xAI metadata migrates to SpaceX AI and is never serialized under the old key', () => {
  const { withPersist } = load('packages/aihappey-state/src/persist.ts', {
    'zustand/middleware': { persist: (_, options) => options },
    './slices/chatSlice': { DEFAULT_CHAT_VERBOSITY: 'medium', DEFAULT_SIDE_INFERENCE_AGENT_SELECTION: {}, DEFAULT_TOOL_OUTPUT_CONTENT_SETTINGS: {} },
    './slices/uiSlice': { normalizeCustomProviders: value => value ?? {} },
    './slices/apiKeyEncryption': { resolveApiKeyEncryptionStatus: () => 'unconfigured' },
    './slices/providerHeaders': { normalizeProviderHeaders: value => value ?? {} },
  });
  const options = withPersist(() => ({}));
  assert.ok(options.version > 35);
  const saved = {
    providerRealtimeMetadata: { xai: { token: 'legacy-stt-option' }, google: { keep: true } },
    providerRealtimeConversationMetadata: { xai: { voice: 'legacy' }, openai: { keep: true } },
    providerTranscriptionMetadata: { xai: { language: 'en' } },
  };
  const migrated = options.migrate(saved, 35);
  const serialized = options.partialize(saved);
  for (const result of [migrated, serialized]) {
    for (const field of Object.keys(saved)) assert.equal(Object.hasOwn(result[field], 'xai'), false);
    assert.equal(result.providerRealtimeMetadata.spacexai.token, 'legacy-stt-option');
    assert.equal(result.providerRealtimeConversationMetadata.spacexai.voice, 'legacy');
    assert.equal(result.providerTranscriptionMetadata.spacexai.language, 'en');
    assert.equal(result.providerRealtimeMetadata.google.keep, true);
    assert.equal(result.providerRealtimeConversationMetadata.openai.keep, true);
  }
  assert.equal(saved.providerRealtimeConversationMetadata.xai.voice, 'legacy');
});

const theme = new Proxy({}, { get: (_, name) => name });
const components = new Proxy({ useTheme: () => theme }, { get: (target, name) => target[name] ?? name });
const staticReact = { ...React, useState: initial => [initial, () => {}], useEffect: () => {} };
const i18n = { useTranslation: () => ({ t: key => key }) };
function find(node, predicate) {
  if (!React.isValidElement(node)) return;
  if (predicate(node)) return node;
  for (const child of React.Children.toArray(node.props.children)) {
    const result = find(child, predicate);
    if (result) return result;
  }
}

test('realtime provider forms read legacy xAI, prefer SpaceX AI and write only the canonical key', () => {
  const settings = load('packages/aihappey-components/src/modals/RealtimeSettingsModal.tsx', {
    react: staticReact, 'aihappey-i18n': i18n, '../theme/ThemeContext': components, '../forms': components, '../buttons': components,
  });
  for (const providerKey of ['spacexai', 'SpaceXAI', 'xai', 'xAI']) {
    assert.equal(settings.normalizeRealtimeSettingsProviderKey(providerKey), 'spacexai');
    assert.equal(settings.hasRealtimeProviderConfig(providerKey), true);
    const metadata = { xai: { voice: 'legacy' }, google: { keep: true } };
    let saved;
    let form = settings.RealtimeProviderConfigForm({ providerKey, providerMetadata: metadata, setProviderMetadata: value => { saved = value; } });
    assert.equal(form.type, 'XAIRealtimeConversationConfigForm');
    assert.equal(form.props.config.voice, 'legacy');
    form.props.updateConfig({ voice: 'new' });
    assert.deepEqual(saved, { spacexai: { voice: 'new' }, google: metadata.google });
    form = settings.RealtimeProviderConfigForm({ providerKey, providerMetadata: { ...metadata, spacexai: { voice: 'canonical' } }, setProviderMetadata() {} });
    assert.equal(form.props.config.voice, 'canonical');
  }
});

test('transcription modal reads the legacy key and saves only SpaceX AI, including old enabled-provider names', () => {
  const { TranscriptionSettingsModal } = load('packages/aihappey-components/src/modals/TranscriptionSettingsModal.tsx', {
    react: staticReact, 'aihappey-i18n': i18n, '../theme/ThemeContext': components, '../forms': components, '../buttons': components,
    '../forms/providers/azure/AzureTranscriptionConfigForm': components,
  });
  for (const name of ['SpaceXAI', 'xAI']) {
    let saved;
    const tree = TranscriptionSettingsModal({
      enabledProviders: [name], providerMetadata: { xai: { language: 'en' }, google: { keep: true } },
      realtimeProviderMetadata: {}, setProviderMetadata: value => { saved = value; }, onClose() {},
    });
    assert.equal(find(tree, node => node.type === 'Tabs').props.activeKey, 'spacexai');
    const form = find(tree, node => node.type === 'XAITranscriptionConfigForm');
    assert.equal(form.props.config.language, 'en');
    form.props.updateConfig({ language: 'nl' });
    assert.deepEqual(saved, { spacexai: { language: 'nl' }, google: { keep: true } });
  }
});

test('agent and global provider transcription settings consistently read/write the SpaceX AI key', () => {
  let saved;
  const state = { providerTranscriptionMetadata: { xai: { language: 'en' }, google: { keep: true } } };
  state.setProviderTranscriptionMetadata = value => { saved = value; };
  const settings = load(root + '../providers/ProviderTypeSettings.tsx', {
    react: React, 'aihappey-components': components,
    'aihappey-state': { useAppStore: selector => selector(state), store: { getState: () => state } },
    '../chat/context/ChatContext': { useChatContext: () => ({ config: {} }) },
    '../provider-config/google/GoogleChatConfig': components,
  });
  for (const providerKey of ['spacexai', 'xai']) {
    assert.equal(settings.hasProviderTypeSettings(providerKey, 'transcription'), true);
    const form = settings.AudioProviderSettings({ providerKey, type: 'transcription', metadata: state.providerTranscriptionMetadata, onChange: value => { saved = value; } });
    assert.equal(form.props.config.language, 'en');
    form.props.updateConfig({ language: 'nl' });
    assert.deepEqual(saved, { spacexai: { language: 'nl' }, google: { keep: true } });
    const globalForm = settings.ProviderTypeSettings({ providerKey, type: 'transcription' });
    assert.equal(globalForm.props.config.language, 'en');
    globalForm.props.updateConfig({ language: 'de' });
    assert.deepEqual(saved, { spacexai: { language: 'de' }, google: { keep: true } });
  }
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
