const assert = require('node:assert/strict');
const { test } = require('node:test');
const { load } = require('./credential-test-loader.cjs');
const root = 'packages/aihappey-core/src/features/';
const ai = { base64ToUint8Array: value => new Uint8Array(Buffer.from(value, 'base64')) };
const { buildOpenAiSpeechSession, supportsOpenAiSpeech, isOpenAiSpeechModelId } = load(root + 'speech/realtime/openAiSpeechConfig.ts');
const { openOpenAiSpeechSession, openAiSpeechBatchLength } = load(root + 'speech/realtime/openAiSpeechSession.ts', { 'aihappey-ai': ai });
const { agentSpeechModelOptions } = load(root + 'agents/agentAudioModels.ts');
const { StreamingAgentSpeech } = load(root + 'realtime/streamingAgentSpeech.ts');
const model = 'openai/gpt-realtime-2.1-mini';
const tick = () => new Promise(resolve => setImmediate(resolve));
class Socket {
    static OPEN = 1; static instances = [];
    readyState = 0; bufferedAmount = 0; messages = [];
    constructor(url, protocols) { this.url = String(url); this.protocols = protocols; Socket.instances.push(this); queueMicrotask(() => { this.readyState = 1; this.onopen?.(); }); }
    send(text) { this.messages.push(JSON.parse(text)); }
    close() { this.readyState = 3; this.onclose?.(); }
    event(value) { this.onmessage?.({ data: JSON.stringify(value) }); }
    requests() { return this.messages.filter(message => message.type === 'response.create'); }
    created(id, index = this.requests().length - 1) { this.event({ type: 'response.created', response: { id, metadata: this.requests()[index].response.metadata } }); }
    audio(id, data = 'AQI=') { this.event({ type: 'response.output_audio.delta', response_id: id, delta: data }); }
    done(id, status = 'completed') { this.event({ type: 'response.done', response: { id, status } }); }
}
function install(t) { const original = globalThis.WebSocket; globalThis.WebSocket = Socket; t.after(() => { globalThis.WebSocket = original; }); }
async function opened(t, extra = {}) {
    install(t);
    const abort = new AbortController(), audio = []; let failures = 0;
    const opening = openOpenAiSpeechSession({ model, token: 'ek_fixture', signal: abort.signal, audio: bytes => audio.push(...bytes), failed: () => failures++, ...extra });
    const socket = Socket.instances.at(-1); await tick();
    socket.event({ type: 'session.updated', session: buildOpenAiSpeechSession(model, extra.options) });
    const session = await opening; t.after(() => session.dispose());
    return { session, socket, abort, audio, failures: () => failures };
}

test('agent-only capability preserves global audio classification and requires explicit current tags', () => {
    const target = { id: model, type: 'audio', tags: ['real-time', 'realtime-token', 'realtime-session', 'realtime-speech'] };
    assert.equal(supportsOpenAiSpeech(target), true);
    for (const tag of ['real-time', 'realtime-token', 'realtime-speech']) assert.equal(supportsOpenAiSpeech({ ...target, tags: target.tags.filter(value => value !== tag) }), false);
    assert.equal(supportsOpenAiSpeech({ ...target, id: 'openai/gpt-realtime-2.1' }), false);
    const options = agentSpeechModelOptions([target, { id: 'google/tts', type: 'speech' }, { id: 'other/audio', type: 'audio' }]);
    assert.deepEqual(options.map(value => value.id), [model, 'google/tts']); assert.equal(options[0].type, 'speech'); assert.equal(target.type, 'audio');
    assert.equal(isOpenAiSpeechModelId(model + '-2026-10-01'), true); assert.equal(isOpenAiSpeechModelId(model + '-unexpected'), false);
});

test('GA speech configuration allowlists voice/speed, disables VAD and tools, and never copies HTTP or credential settings', () => {
    const config = buildOpenAiSpeechSession(model, { voice: 'cedar', speed: 1.2, response_format: 'mp3', api_key: 'secret', instructions: 'ignore', url: 'evil' });
    assert.deepEqual(config.audio.output, { format: { type: 'audio/pcm', rate: 24000 }, voice: 'cedar', speed: 1.2 });
    assert.equal(config.audio.input.turn_detection, null); assert.deepEqual(config.tools, []); assert.equal(config.tool_choice, 'none');
    for (const value of ['secret', 'mp3', 'evil', '"ignore"']) assert.equal(JSON.stringify(config).includes(value), false);
    for (const options of [{ voice: 'nova' }, { voice: { id: 'custom' } }, { speed: 2 }, { speed: '1' }, { speed: NaN }]) assert.throws(() => buildOpenAiSpeechSession(model, options));
});

test('batching preserves text/Unicode and waits for sentence completion instead of speaking every token', () => {
    assert.equal(openAiSpeechBatchLength('Hel', false), 0); assert.equal(openAiSpeechBatchLength('Hello.', false), 0);
    assert.equal(openAiSpeechBatchLength('Hello. Again', false), 7);
    let text = 'word '.repeat(600) + '😀 end'; const original = text; let joined = '';
    while (text) { const count = openAiSpeechBatchLength(text, true); joined += text.slice(0, count); text = text.slice(count); }
    assert.equal(joined, original);
    assert.equal(openAiSpeechBatchLength('a'.repeat(999) + '😀x', true), 999);
});

test('browser authenticates only with ephemeral subprotocols, waits for session.updated, and never requests microphone access', async t => {
    install(t); let resolved = false;
    const opening = openOpenAiSpeechSession({ model, token: 'ek_fixture', signal: new AbortController().signal, audio() {} }).then(value => { resolved = true; return value; });
    const socket = Socket.instances.at(-1); await tick();
    assert.deepEqual(socket.protocols, ['realtime', 'openai-insecure-api-key.ek_fixture']); assert.equal(socket.url.includes('fixture'), false);
    assert.equal(socket.messages[0].type, 'session.update'); assert.equal('model' in socket.messages[0].session, false);
    socket.event({ type: 'session.created', session: buildOpenAiSpeechSession(model) }); await tick(); assert.equal(resolved, false);
    assert.equal(socket.requests().length, 0);
    socket.event({ type: 'session.updated', session: buildOpenAiSpeechSession(model) }); const session = await opening; session.dispose();
    await assert.rejects(openOpenAiSpeechSession({ model, token: 'sk_permanent', signal: new AbortController().signal, audio() {} }), /short-lived/);
});

test('ordered out-of-band responses stream audio, ignore stale IDs, and finish only after final response.done', async t => {
    const { session, socket, audio } = await opened(t);
    session.append('Hel'); assert.equal(socket.requests().length, 0);
    session.append('lo. '); assert.equal(socket.requests().length, 1);
    session.append('Again.'); let complete = false; const finished = session.finish().then(() => { complete = true; });
    socket.event({ type: 'response.created', response: { id: 'foreign', metadata: { speech_request: 'other' } } }); socket.audio('foreign');
    socket.created('first'); socket.audio('stale'); socket.audio('first'); socket.done('stale'); await tick();
    assert.deepEqual(audio, [1, 2]); assert.equal(socket.requests().length, 1); assert.equal(complete, false);
    socket.event({ type: 'response.output_audio.done', response_id: 'first' }); assert.equal(socket.requests().length, 1);
    socket.done('first'); assert.equal(socket.requests().length, 2); socket.done('first');
    const responses = socket.requests().map(value => value.response);
    assert.deepEqual(responses.map(value => value.input[0].content[0].text), ['Hello. ', 'Again.']);
    assert.ok(responses.every(value => value.conversation === 'none' && value.input.length === 1 && value.output_modalities[0] === 'audio'));
    socket.created('second'); socket.audio('first'); socket.audio('second'); socket.done('second'); await finished;
    assert.equal(complete, true); assert.deepEqual(audio, [1, 2, 1, 2]); assert.equal(socket.readyState, 3);
});

for (const status of ['failed', 'cancelled', 'incomplete']) test(`terminal ${status} is not mistaken for successful speech`, async t => {
    const { session, socket, failures } = await opened(t); session.append('Hello');
    const finished = session.finish(); socket.created('one'); socket.audio('one'); socket.done('one', status);
    await assert.rejects(finished, /speech failed/); assert.equal(failures(), 1); assert.equal(socket.readyState, 3);
});

for (const data of [null, 'AQ==']) test(`completion rejects ${data ? 'incomplete PCM samples' : 'missing audio'}`, async t => {
    const { session, socket } = await opened(t); session.append('Hello'); const finished = session.finish();
    socket.created('one'); if (data) socket.audio('one', data); socket.done('one'); await assert.rejects(finished);
});

test('barge-in closes the block socket, cancels the active response, drops queued text/audio and rejects completion', async t => {
    const { session, socket, abort, audio } = await opened(t); session.append('Hello. Next.'); socket.created('one');
    const finished = session.finish(); abort.abort(); await assert.rejects(finished);
    assert.deepEqual(socket.messages.at(-1), { type: 'response.cancel', response_id: 'one' });
    socket.audio('one'); socket.done('one'); assert.deepEqual(audio, []); assert.equal(socket.requests().length, 1); assert.equal(socket.readyState, 3);
});

test('startup and response timeouts close sockets and upstream errors remain sanitized', async t => {
    install(t); t.mock.timers.enable({ apis: ['setTimeout'] });
    const opening = openOpenAiSpeechSession({ model, token: 'ek_fixture', signal: new AbortController().signal, audio() {} });
    const first = Socket.instances.at(-1); await tick(); t.mock.timers.tick(15001); await assert.rejects(opening, /timed out/); assert.equal(first.readyState, 3);
    const setup = openOpenAiSpeechSession({ model, token: 'ek_fixture', signal: new AbortController().signal, audio() {} });
    const socket = Socket.instances.at(-1); await tick(); socket.event({ type: 'session.updated', session: buildOpenAiSpeechSession(model) });
    const session = await setup; session.append('Hello. '); const finished = session.finish(); t.mock.timers.tick(60001);
    await assert.rejects(finished, /timed out/); assert.equal(socket.readyState, 3);
    const setupError = openOpenAiSpeechSession({ model, token: 'ek_fixture', signal: new AbortController().signal, audio() {} });
    const bad = Socket.instances.at(-1); await tick(); bad.event({ type: 'error', error: { message: 'ek_secret sk_secret' } });
    await assert.rejects(setupError, error => !error.message.includes('secret'));
});

test('negotiated non-PCM sessions fail before accepting text', async t => {
    install(t); const setup = openOpenAiSpeechSession({ model, token: 'ek_fixture', signal: new AbortController().signal, audio() {} });
    const socket = Socket.instances.at(-1); await tick(); const config = buildOpenAiSpeechSession(model); config.audio.output.format.rate = 48000;
    socket.event({ type: 'session.updated', session: config }); await assert.rejects(setup); assert.equal(socket.requests().length, 0);
});

test('Realtime-only failures never fall back to HTTP or poison the agent text stream', async () => {
    const errors = []; const abort = new AbortController();
    const observer = new StreamingAgentSpeech({ signal: abort.signal, allowLegacyFallback: false,
        open: async () => { throw new Error('fixture'); }, legacy: async () => assert.fail('HTTP fallback'), error: value => errors.push(value) });
    for (const id of ['first', 'second']) { const response = observer.response(id); response.handle({ type: 'text-delta', id, delta: 'Hello' }); response.handle({ type: 'text-end', id }); }
    await observer.drain(); assert.equal(errors.length, 1); abort.abort();
});

test('agent entry point scopes credential headers, sends GA session config, and drains scheduled PCM before completion', async t => {
    install(t);
    const { openAgentSpeech } = load(root + 'realtime/openAgentSpeech.ts', { 'aihappey-ai': ai });
    let captured; const sources = []; const context = { state: 'running', currentTime: 0, destination: {}, async resume() {},
        createBuffer(channels, count, rate) { return { duration: count / rate, getChannelData: () => new Float32Array(count) }; },
        createBufferSource() { const source = { connect() {}, disconnect() {}, start() {}, stop() {} }; sources.push(source); return source; } };
    const opening = openAgentSpeech({ config: { baseUrl: 'https://gateway', endpoints: { realtime: '/api/realtime' },
        fetch: async (url, init) => { captured = { url, headers: new Headers(init.headers), body: JSON.parse(init.body) }; return Response.json({ value: 'ek_fixture', expires_at: Date.now() / 1000 + 60 }); } },
        model: { id: model, type: 'speech', providerMetadata: { openai: { voice: 'cedar', response_format: 'mp3' } } },
        customHeaders: { 'X-OpenAI-Key': 'sk_private', 'X-Google-Key': 'other-private', 'X-AIHappey-Debug': 'true' }, signal: new AbortController().signal, context, started() {} });
    while (!captured || !Socket.instances.at(-1)?.messages.length || Socket.instances.at(-1)?.readyState !== 1) await tick();
    // Wait until the async credential request has constructed this operation's socket.
    await tick(); const socket = Socket.instances.at(-1); const config = buildOpenAiSpeechSession(model, { voice: 'cedar' });
    socket.event({ type: 'session.updated', session: config }); const session = await opening;
    assert.equal(captured.headers.get('x-openai-key'), 'sk_private'); assert.equal(captured.headers.get('x-google-key'), null); assert.equal(captured.headers.get('x-aihappey-debug'), null);
    assert.deepEqual(captured.body.providerOptions.openai.session, config); assert.equal(socket.url.includes('private'), false);
    session.append('Hello'); let completed = false; const finished = session.finish().then(() => { completed = true; });
    socket.created('one'); socket.audio('one'); socket.done('one'); await tick(); assert.equal(completed, false); assert.equal(sources.length, 1);
    context.currentTime = 1; sources[0].onended(); await finished; session.dispose();
});
