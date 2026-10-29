const assert = require('node:assert/strict');
const { test } = require('node:test');
const { load } = require('./credential-test-loader.cjs');
const root = 'packages/aihappey-core/src/features/';
const model = 'mistral/voxtral-mini-tts-3-0';
const { buildMistralSpeechSession, openMistralSpeechSession } = load(root + 'speech/realtime/mistralSpeechSession.ts', {
    'aihappey-ai': { base64ToUint8Array: value => new Uint8Array(Buffer.from(value, 'base64')) },
});
const { StreamingWaveDecoder } = load(root + 'speech/realtime/streamingWaveDecoder.ts');
const { supportsRealtimeSpeech } = load(root + 'speech/realtime/speechProtocol.ts');
const tick = () => new Promise(resolve => setImmediate(resolve));

function wave(samples = [0, 128, 255, 127], rate = 24000) {
    const header = Buffer.alloc(44);
    header.write('RIFF'); header.writeUInt32LE(36 + samples.length, 4); header.write('WAVEfmt ', 8);
    header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
    header.writeUInt32LE(rate, 24); header.writeUInt32LE(rate * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
    header.write('data', 36); header.writeUInt32LE(samples.length, 40);
    return Buffer.concat([header, Buffer.from(samples)]);
}
class Socket {
    static OPEN = 1; static instances = [];
    readyState = 1; bufferedAmount = 0; messages = [];
    constructor(url, protocols) { this.url = url; this.protocols = protocols; Socket.instances.push(this); }
    send(raw) { this.messages.push(JSON.parse(raw)); }
    close() { this.readyState = 3; this.onclose?.({ code: 1000 }); }
    event(value) { this.onmessage?.({ data: JSON.stringify(value) }); }
    audio(bytes) { this.event({ type: 'speech.audio.delta', audio_data: Buffer.from(bytes).toString('base64') }); }
    serverClose(code = 1000) { this.readyState = 3; this.onclose?.({ code, reason: 'never-log-this-secret' }); }
}
async function harness(t, options = {}, configure = true) {
    const previous = globalThis.WebSocket; globalThis.WebSocket = Socket;
    const abort = new AbortController(), audio = [], failures = [];
    t.after(() => { abort.abort(); globalThis.WebSocket = previous; });
    let opened = false;
    const opening = openMistralSpeechSession({ model, options, token: 'rt_fixture', signal: abort.signal,
        audio: (bytes, rate) => audio.push({ bytes: [...bytes], rate }), failed: () => failures.push(true) });
    opening.then(() => { opened = true; }, () => {});
    const socket = Socket.instances.at(-1);
    socket.event({ type: 'session.created', session: { response_format: 'wav' } });
    if (!configure) return { opening, socket, abort, audio, failures, opened: () => opened };
    socket.event({ type: 'session.updated', session: buildMistralSpeechSession(model, options).session });
    const session = await opening; t.after(() => session.dispose());
    return { session, socket, abort, audio, failures };
}

test('only the verified speech model is enabled, and catalog tags remain required', () => {
    const current = { id: model, type: 'speech', tags: ['real-time', 'realtime-token'] };
    assert.equal(supportsRealtimeSpeech(current), true);
    for (const id of [model + '/sarah', 'mistral/voxtral-mini-tts-latest', 'mistral/voxtral-mini-tts-2603']) {
        assert.equal(supportsRealtimeSpeech({ ...current, id }), false); assert.throws(() => buildMistralSpeechSession(id));
    }
    assert.equal(supportsRealtimeSpeech({ ...current, tags: [] }), false);
});

test('session configuration allowlists documented settings and uses metadata-bearing WAV', () => {
    assert.deepEqual(buildMistralSpeechSession(model).session, { voice: 'voice_447', streaming_mode: 'responsive', response_format: 'wav' });
    const options = { voice_id: 'voice_0', streaming_mode: 'long_form', response_format: 'mp3', api_key: 'private', language: 'nl', speed: 1.2 };
    const original = structuredClone(options);
    assert.deepEqual(buildMistralSpeechSession(model, options).session, { voice: 'voice_0', streaming_mode: 'long_form', response_format: 'wav' });
    assert.deepEqual(options, original);
    assert.deepEqual(buildMistralSpeechSession(model, { ref_audio: 'AQI=' }).session,
        { ref_audio: 'AQI=', streaming_mode: 'responsive', response_format: 'wav' });
    for (const invalid of [{ voice: 'sarah' }, { voice: 'voice_1', ref_audio: 'AQI=' }, { ref_audio: 'not base64' }, { streaming_mode: 'fast' }, { sampleRate: 44100 }])
        assert.throws(() => buildMistralSpeechSession(model, invalid));
});

test('WAV parsing is incremental at every byte boundary and reads the actual sample rate', () => {
    const bytes = wave([1, 2, 3, 4], 44100), result = [];
    const decoder = new StreamingWaveDecoder((pcm, rate) => { result.push(...pcm); assert.equal(rate, 44100); });
    for (const byte of bytes) decoder.push(new Uint8Array([byte]));
    decoder.finish(); assert.deepEqual(result, [1, 2, 3, 4]);
    const stream = wave(); stream.writeUInt32LE(0xffffffff, 40);
    const unknown = new StreamingWaveDecoder(() => {}); unknown.push(stream); unknown.finish();
    const stereo = wave(); stereo.writeUInt16LE(2, 22);
    assert.throws(() => new StreamingWaveDecoder(() => {}).push(stereo));
    const truncated = new StreamingWaveDecoder(() => {}); truncated.push(wave().subarray(0, 45)); assert.throws(() => truncated.finish());
    const huge = wave(); huge.writeUInt32LE(100000, 16);
    assert.throws(() => new StreamingWaveDecoder(() => {}).push(huge));
});

test('browser authenticates by ephemeral subprotocol, waits for configuration, and preserves text deltas', async t => {
    const h = await harness(t, { voice: 'voice_0' }, false);
    assert.deepEqual(h.socket.protocols, ['realtime', 'rt_fixture']); assert.equal(h.socket.url.includes('rt_fixture'), false);
    assert.equal(h.socket.messages.length, 1); assert.equal(h.socket.messages[0].type, 'session.update');
    await tick(); assert.equal(h.opened(), false);
    h.socket.event({ type: 'session.updated', session: buildMistralSpeechSession(model, { voice: 'voice_0' }).session });
    const session = await h.opening; t.after(() => session.dispose());
    session.append(' Hello '); session.append('world.\n');
    assert.deepEqual(h.socket.messages.slice(1), [{ type: 'input_text.append', text: ' Hello ' }, { type: 'input_text.append', text: 'world.\n' }]);
    h.socket.audio(wave().subarray(0, 45)); assert.deepEqual(h.audio, [{ bytes: [0], rate: 24000 }]);
    const finished = session.finish(); h.socket.audio(wave().subarray(45));
    h.socket.event({ type: 'speech.audio.done' });
    let done = false; finished.then(() => { done = true; }); await tick(); assert.equal(done, false, 'audio.done is not server closure or playback drain');
    assert.deepEqual(h.socket.messages.at(-1), { type: 'input_text.end' });
    h.socket.serverClose(); await finished;
    assert.deepEqual(h.audio.flatMap(value => value.bytes), [0, 128, 255, 127]);
    assert.equal(h.failures.length, 0);
});

test('flush retains the socket, separates WAV generations, and earlier done cannot finish later input', async t => {
    const { session, socket, audio } = await harness(t);
    session.append('First.'); session.flush(); socket.audio(wave([1, 2])); socket.event({ type: 'speech.audio.done' });
    assert.equal(socket.readyState, 1);
    session.append(' Second.'); session.flush(); session.append(' Third.');
    let complete = false; const finish = session.finish().then(() => { complete = true; });
    socket.audio(wave([3, 4])); socket.event({ type: 'speech.audio.done' }); await tick(); assert.equal(complete, false);
    socket.audio(wave([5, 6])); socket.event({ type: 'speech.audio.done' }); socket.serverClose(); await finish;
    assert.deepEqual(audio.flatMap(value => value.bytes), [1, 2, 3, 4, 5, 6]);
    assert.equal(socket.messages.filter(value => value.type === 'input_text.end').length, 1);
    await session.finish();
});

test('end after flushed input does not expect an extra generation, and empty sessions can finish', async t => {
    const first = await harness(t); first.session.append('First.'); first.session.flush();
    first.socket.audio(wave()); first.socket.event({ type: 'speech.audio.done' });
    const finish = first.session.finish(); first.socket.serverClose(); await finish;
    const empty = await harness(t); const ended = empty.session.finish(); empty.socket.serverClose(); await ended;
});

test('premature normal close and provider errors reject without leaking provider messages', async t => {
    const h = await harness(t); h.session.append('Pending.'); const finish = h.session.finish();
    h.socket.serverClose(); await assert.rejects(finish, /final speech/);
    const next = await harness(t); next.socket.event({ type: 'error', error: { message: 'rt_super_secret' } });
    await assert.rejects(next.session.finish(), error => !error.message.includes('rt_super_secret'));
});

test('incompatible acknowledgement fails setup instead of sending text', async t => {
    const h = await harness(t, {}, false);
    h.socket.event({ type: 'session.updated', session: { voice: 'voice_447', streaming_mode: 'responsive', response_format: 'mp3' } });
    await assert.rejects(h.opening, /incompatible/); assert.equal(h.socket.messages.length, 1);
});

test('cancellation closes only, rejects pending finish, and ignores late audio', async t => {
    const h = await harness(t); h.session.append('Hello.'); const finish = h.session.finish(); h.abort.abort();
    await assert.rejects(finish, /cancelled/); h.socket.audio(wave());
    assert.deepEqual(h.audio, []); assert.equal(h.socket.messages.some(value => /cancel|flush/.test(value.type)), false);
});

test('startup timeout and send backlog are bounded', async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const h = await harness(t, {}, false); t.mock.timers.tick(15001); await assert.rejects(h.opening, /timed out/);
    const current = await harness(t); current.socket.bufferedAmount = 512 * 1024 + 1;
    assert.throws(() => current.session.append('Hello'), /backlog/);
});
