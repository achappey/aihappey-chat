const assert = require('node:assert/strict');
const { test } = require('node:test');
const { load } = require('./credential-test-loader.cjs');
const root = 'packages/aihappey-core/src/features/';
const { speechProtocolFactories: factories, supportsRealtimeSpeech } = load(root + 'speech/realtime/speechProtocol.ts');
const { StreamingAgentSpeech } = load(root + 'realtime/streamingAgentSpeech.ts');
const { PcmSpeechOutput } = load(root + 'speech/realtime/pcmSpeechOutput.ts');
const { openStreamingSpeechSession } = load(root + 'speech/realtime/streamingSpeechSession.ts', {
    'aihappey-ai': { base64ToUint8Array: value => new Uint8Array(Buffer.from(value, 'base64')) },
});
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

test('catalog capability and a registered adapter are both required; other speech models remain legacy', () => {
    const model = { id: 'deepgram/aura-2-asteria-en', type: 'speech', tags: ['real-time', 'realtime-token'] };
    assert.equal(supportsRealtimeSpeech(model), true);
    assert.equal(supportsRealtimeSpeech({ ...model, tags: [] }), false);
    assert.equal(supportsRealtimeSpeech({ ...model, type: 'transcription' }), false);
    assert.equal(supportsRealtimeSpeech({ ...model, id: 'future/tts' }), false);
});

test('protocol adapters retain model/voice identity, normalize playback to PCM, and allowlist settings', () => {
    const dg = factories.deepgram('aura-2-asteria-en', { sampleRate: 48000, speed: 1.2, api_key: 'secret', url: 'wss://evil.invalid' });
    assert.equal(dg.sampleRate, 48000);
    assert.equal(new URL(dg.url).searchParams.get('encoding'), 'linear16');
    assert.equal(dg.url.includes('secret'), false);
    assert.deepEqual(dg.append('Hel'), { type: 'Speak', text: 'Hel' });
    assert.deepEqual(dg.finish(), { type: 'Flush' });
    const cs = factories.cartesia('tts/sonic-3.6/voice-id', { language: 'nl', speed: 1.1, volume: 0.8, emotion: 'calm', sampleRate: 44100 });
    const first = cs.append('Hel'), last = cs.finish();
    assert.deepEqual(first.voice, { id: 'voice-id' });
    assert.equal(first.model_id, 'sonic-3.6');
    assert.equal(first.continue, true); assert.equal(last.continue, false); assert.equal(last.transcript, '');
    assert.equal(first.context_id, last.context_id);
    assert.deepEqual(first.output_format, { container: 'raw', encoding: 'pcm_s16le', sample_rate: 44100 });
    assert.equal(cs.audio({ type: 'chunk', context_id: 'stale', data: 'AA==' }), undefined);
    assert.equal(cs.done({ type: 'done', context_id: first.context_id }), true);
    assert.throws(() => factories.cartesia('tts/unknown/voice-id', {}));
    assert.throws(() => factories.deepgram('aura-2-asteria-en', { sampleRate: 44100 }));
});

test('partial text is forwarded before text-end, ordered across responses, and never includes reasoning/tools', async () => {
    const events = [], abort = new AbortController();
    const speech = new StreamingAgentSpeech({ signal: abort.signal, open: async started => ({
        append: text => { events.push(text); started(); }, flush() {}, finish: async () => events.push('done'), cancel() {}, dispose() {},
    }), legacy: async () => assert.fail('unexpected fallback'), error: error => assert.fail(String(error)) });
    const first = speech.response('run:0');
    first.handle({ type: 'text-delta', id: 'a', delta: 'Hel' }); await tick();
    assert.deepEqual(events, ['Hel']);
    first.handle({ type: 'reasoning-delta', delta: 'private' });
    first.handle({ type: 'tool-input-available', input: 'secret' });
    first.handle({ type: 'text-delta', id: 'a', delta: 'lo.' });
    first.handle({ type: 'text-end', id: 'a' }); first.handle({ type: 'text-delta', id: 'a', delta: 'stale' });
    const second = speech.response('run:1'); second.handle({ type: 'text-delta', id: 'a', delta: 'Again.' }); second.handle({ type: 'text-end', id: 'a' });
    await speech.drain(); assert.deepEqual(events, ['Hel', 'lo.', 'done', 'Again.', 'done']); abort.abort();
});

for (const played of [false, true]) test(`socket failure ${played ? 'after' : 'before'} playback obeys fallback boundary`, async () => {
    const fallback = [], errors = [], abort = new AbortController();
    const speech = new StreamingAgentSpeech({ signal: abort.signal, open: async started => ({
        append() { if (played) started(); throw new Error('socket failed'); }, flush() {}, finish: async () => {}, cancel() {}, dispose() {},
    }), legacy: async text => fallback.push(text), error: error => errors.push(error) });
    const response = speech.response('one');
    response.handle({ type: 'text-delta', id: 'a', delta: 'Hel' }); await tick();
    assert.deepEqual(fallback, [], 'fallback waits for completed text');
    response.handle({ type: 'text-delta', id: 'a', delta: 'lo.' }); response.handle({ type: 'text-end', id: 'a' });
    await speech.drain();
    assert.deepEqual(fallback, played ? [] : ['Hello.']); assert.equal(errors.length, played ? 1 : 0); abort.abort();
});

test('barge-in cancels pending speech without fallback and late text cannot restart it', async () => {
    const abort = new AbortController(); let calls = 0, cancelled = 0;
    const speech = new StreamingAgentSpeech({ signal: abort.signal, open: async () => ({
        append() { calls++; }, flush() {}, finish: async () => {}, cancel() { cancelled++; }, dispose() {},
    }), legacy: async () => assert.fail('cancelled turn replayed'), error: () => assert.fail('cancellation reported') });
    const response = speech.response('one'); response.handle({ type: 'text-delta', id: 'a', delta: 'Hello' }); await tick();
    abort.abort(); response.handle({ type: 'text-delta', id: 'a', delta: 'late' }); await speech.drain();
    assert.equal(calls, 1); assert.equal(cancelled, 1);
});

class Socket {
    static OPEN = 1; static instances = [];
    readyState = 0; bufferedAmount = 0; messages = [];
    constructor(url, protocols) { this.url = String(url); this.protocols = protocols; Socket.instances.push(this); queueMicrotask(() => { this.readyState = 1; this.onopen?.(); }); }
    send(text) { this.messages.push(JSON.parse(text)); }
    close() { this.readyState = 3; this.onclose?.(); }
    event(value) { this.onmessage?.({ data: value instanceof ArrayBuffer ? value : JSON.stringify(value) }); }
}

test('Deepgram uses a bearer subprotocol; final completion waits for the final flush, not a duplicate earlier ack', async t => {
    const originalSocket = globalThis.WebSocket; globalThis.WebSocket = Socket; t.after(() => { globalThis.WebSocket = originalSocket; });
    let now = 100000;
    t.mock.method(Date, 'now', () => now);
    const abort = new AbortController(), audio = [];
    const session = await openStreamingSpeechSession({ protocol: factories.deepgram('aura-2-asteria-en'), token: 'ephemeral', signal: abort.signal, audio: bytes => audio.push(bytes) });
    const socket = Socket.instances.at(-1);
    assert.deepEqual(socket.protocols, ['bearer', 'ephemeral']); assert.equal(socket.url.includes('ephemeral'), false);
    session.append('Hello.'); session.flush(); socket.event({ type: 'Flushed', sequence_id: 0 });
    session.append(' Again.'); now += 3201;
    let complete = false; const final = session.finish().then(() => { complete = true; });
    socket.event({ type: 'Flushed', sequence_id: 0 }); await tick(); assert.equal(complete, false);
    socket.event(new Uint8Array([0, 1]).buffer); assert.equal(audio.length, 1);
    socket.event({ type: 'Flushed', sequence_id: 1 }); await final; assert.equal(complete, true);
    session.dispose(); abort.abort(); assert.equal(socket.readyState, 3);
});

test('Cartesia filters contexts, finalizes once, sanitizes errors, and uses only its ephemeral query token', async t => {
    const originalSocket = globalThis.WebSocket; globalThis.WebSocket = Socket; t.after(() => { globalThis.WebSocket = originalSocket; });
    const abort = new AbortController(), bytes = [], protocol = factories.cartesia('tts/sonic-3.6/voice-id');
    const session = await openStreamingSpeechSession({ protocol, token: 'ephemeral', signal: abort.signal, audio: value => bytes.push(...value) });
    const socket = Socket.instances.at(-1); assert.equal(new URL(socket.url).searchParams.get('access_token'), 'ephemeral');
    session.append('Hello'); const context = socket.messages[0].context_id;
    socket.event({ type: 'chunk', context_id: 'stale', data: 'AQI=' }); assert.deepEqual(bytes, []);
    socket.event({ type: 'chunk', context_id: context, data: 'AQI=' }); assert.deepEqual(bytes, [1, 2]);
    const final = session.finish(); socket.event({ type: 'done', context_id: context }); await final;
    assert.equal(socket.messages.at(-1).continue, false); session.dispose(); abort.abort();
    const failed = await openStreamingSpeechSession({ protocol, token: 'ephemeral', signal: new AbortController().signal, audio() {} });
    const bad = Socket.instances.at(-1); bad.event({ type: 'error', message: 'secret-token' });
    await assert.rejects(failed.finish(), error => !error.message.includes('secret-token')); failed.dispose();
});

test('PCM output handles split samples, schedules contiguous chunks, and stops all queued audio on abort', () => {
    const abort = new AbortController(), buffers = [], sources = []; let started = 0;
    const context = { currentTime: 0, state: 'running', destination: {},
        createBuffer(channels, count, sampleRate) { const data = new Float32Array(count); const buffer = { duration: count / sampleRate, getChannelData: () => data }; buffers.push(buffer); return buffer; },
        createBufferSource() { const source = { connect() {}, disconnect() {}, start(at) { this.at = at; }, stop() { this.stopped = true; } }; sources.push(source); return source; },
    };
    const output = new PcmSpeechOutput(24000, abort.signal, () => started++, context);
    output.push(new Uint8Array([0])); assert.equal(sources.length, 0);
    output.push(new Uint8Array([128, 255, 127])); output.push(new Uint8Array([0, 0]));
    assert.deepEqual([...buffers[0].getChannelData()], [-1, 32767 / 32768]);
    assert.equal(sources[1].at, sources[0].at + buffers[0].duration);
    assert.equal(started, 0, 'queued frames are not yet playback');
    context.currentTime = 1; abort.abort(); assert.equal(started, 1); assert.equal(sources.every(source => source.stopped), true);
});
