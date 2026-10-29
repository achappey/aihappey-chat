const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const { load } = require('./credential-test-loader.cjs');
const root = 'packages/aihappey-core/src/features/';
const { AgentTranscriptionTurns } = load(root + 'realtime/agentTranscriptionTurns.ts');
const { AgentSpeechQueue, CompletedAgentText } = load(root + 'realtime/agentSpeechQueue.ts');
const { streamSpeech, SpeechStreamingUnsupportedError } = load('packages/aihappey-ai/src/speechStreaming.ts');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function turns(provider) {
    const result = { starts: 0, previews: [], turns: [] };
    result.controller = new AgentTranscriptionTurns(provider, {
        start: () => result.starts++, preview: text => result.previews.push(text), turn: text => result.turns.push(text),
    });
    return result;
}

test('eligibility includes local and catalog definitions, not batch-only or hidden definitions', () => {
    const { getRealtimeAgentEntries, selectAgentAudioModel } = load(root + 'agents/agentAudioModels.ts');
    const audio = { id: 'openai/stt', type: 'transcription', tags: ['real-time'] };
    const agent = { name: 'Local', model: { id: 'openai/chat' }, transcriptionModel: { id: audio.id } };
    const result = getRealtimeAgentEntries([agent, { ...agent, name: 'Batch', transcriptionModel: { id: 'openai/batch' } }],
        [{ id: 'remote/one', agent }, { id: 'remote/no-definition' }], [audio]);
    assert.deepEqual(result.map(entry => entry.key), ['local:Local', 'remote:remote/one']);
    const saved = { id: audio.id, providerMetadata: { openai: { custom: true } }, providerHeaders: { custom: 'value' } };
    assert.equal(selectAgentAudioModel(saved, audio.id, 'transcription'), saved);
    assert.equal(selectAgentAudioModel(saved, '', 'transcription'), undefined);
    assert.deepEqual(selectAgentAudioModel(saved, 'other/stt', 'transcription'), { id: 'other/stt', type: 'transcription' });
});

test('audio configuration round-trips without entering answer model routing', () => {
    const types = load('packages/aihappey-types/src/index.ts');
    const { normalizeAgent } = load('packages/aihappey-agents/src/normalizeAgent.ts', { 'aihappey-types': types });
    const agent = { name: 'Voice', model: { id: 'openai/chat' },
        transcriptionModel: { id: 'deepgram/stt', providerMetadata: { deepgram: { endpointing: 500, opaque: [1, 2] } }, providerHeaders: { deepgram: { test: '1' } } },
        speechModel: { id: 'openai/speech', providerMetadata: { openai: { voice: 'cedar' } } } };
    const normalized = normalizeAgent(JSON.parse(JSON.stringify(agent)));
    assert.deepEqual(normalized.transcriptionModel.providerMetadata, agent.transcriptionModel.providerMetadata);
    assert.deepEqual(normalized.transcriptionModel.providerHeaders, { test: '1' });
    assert.deepEqual(types.getAgentModels(normalized).map(model => model.id), ['openai/chat']);
});

test('Deepgram final fragments wait for endpointing and synthetic duplicates are ignored', async () => {
    const result = turns('deepgram');
    const event = (text, start, final) => ({ type: 'Results', is_final: true, speech_final: final, start, duration: 1, channel: { alternatives: [{ transcript: text }] } });
    result.controller.event(event('Please look', 0, false));
    result.controller.event({ ...event('Please look', 0, true), __synthetic: true });
    result.controller.event(event('Please look', 0, false));
    await sleep(950);
    assert.deepEqual(result.turns, []);
    result.controller.event(event('this up', 1, true));
    assert.deepEqual(result.turns, ['Please look this up']);
    result.controller.dispose();
});

test('only non-empty new transcription interrupts once per utterance; OpenAI submits exactly once', () => {
    const result = turns('openai');
    result.controller.activity(true);
    result.controller.event({ type: 'input_audio_buffer.speech_started', item_id: 'one' });
    assert.equal(result.starts, 0);
    result.controller.event({ type: 'conversation.item.input_audio_transcription.delta', item_id: 'one', delta: 'Hello' });
    const final = { type: 'conversation.item.input_audio_transcription.completed', item_id: 'one', transcript: 'Hello' };
    result.controller.event(final); result.controller.event(final);
    assert.equal(result.starts, 1);
    assert.deepEqual(result.turns, ['Hello']);
    result.controller.dispose();
});

for (const [provider, partial, final] of [
    ['openai', id => ({ type: 'conversation.item.input_audio_transcription.delta', item_id: id, delta: 'Again' }),
        id => ({ type: 'conversation.item.input_audio_transcription.completed', item_id: id, transcript: 'Again' })],
    ['assemblyai', id => ({ type: 'Turn', turn_order: id, transcript: 'Again' }),
        id => ({ type: 'Turn', turn_order: id, end_of_turn: true, transcript: 'Again' })],
    ['gladia', id => ({ type: 'transcript', data: { utterance: { start: id, text: 'Again' } } }),
        id => ({ type: 'transcript', data: { is_final: true, utterance: { start: id, end: id + 1, text: 'Again' } } })],
    ['cartesia', id => ({ type: 'turn.update', turn_id: id, transcript: 'Again' }),
        id => ({ type: 'turn.end', turn_id: id, transcript: 'Again' })],
]) test(`${provider}: late partial/final replays cannot interrupt a submitted turn; identical words in a new utterance are allowed`, () => {
    const result = turns(provider);
    result.controller.event(partial(1)); result.controller.event(final(1));
    assert.equal(result.starts, 1); assert.deepEqual(result.turns, ['Again']);
    result.controller.activity(true); result.controller.activity(false);
    result.controller.event(partial(1)); result.controller.event(final(1));
    assert.equal(result.starts, 1); assert.deepEqual(result.turns, ['Again']);
    result.controller.event(partial(2));
    result.controller.event(partial(1)); result.controller.event(final(1));
    result.controller.event(final(2)); result.controller.event(final(2));
    assert.equal(result.starts, 2); assert.deepEqual(result.turns, ['Again', 'Again']);
    result.controller.dispose();
});

test('OpenAI replayed delta event IDs do not duplicate words and empty completions close only their own item', () => {
    const result = turns('openai');
    const delta = { type: 'conversation.item.input_audio_transcription.delta', item_id: 'new', event_id: 'delta:1', delta: 'Hello' };
    result.controller.event(delta); result.controller.event(delta);
    result.controller.event({ type: 'conversation.item.input_audio_transcription.completed', item_id: 'noise', transcript: '' });
    result.controller.event({ type: 'conversation.item.input_audio_transcription.delta', item_id: 'noise', delta: 'late noise' });
    assert.equal(result.starts, 1); assert.deepEqual(result.previews, ['Hello']);
    result.controller.event({ type: 'conversation.item.input_audio_transcription.completed', item_id: 'new', transcript: 'Hello' });
    assert.deepEqual(result.turns, ['Hello']); result.controller.dispose();
});

test('OpenAI overlapping item transcription does not retire another pending utterance', () => {
    const result = turns('openai');
    const delta = (id, text) => ({ type: 'conversation.item.input_audio_transcription.delta', item_id: id, delta: text });
    const final = (id, text) => ({ type: 'conversation.item.input_audio_transcription.completed', item_id: id, transcript: text });
    result.controller.event(delta('first', 'First'));
    result.controller.event(delta('second', 'Second'));
    result.controller.event(final('first', 'First question'));
    result.controller.event(delta('first', 'late'));
    const starts = result.starts;
    result.controller.event(delta('second', ''));
    assert.equal(result.starts, starts, 'an empty delta cannot promote buffered text into a new interruption');
    result.controller.event(delta('second', ' question'));
    result.controller.event(final('second', 'Second question'));
    result.controller.event(final('first', 'First question'));
    result.controller.event(final('second', 'Second question'));
    assert.deepEqual(result.turns, ['First question', 'Second question']);
    assert.equal(result.previews.includes('Second question'), true); result.controller.dispose();
});

test('Deepgram old timed results cannot interrupt after endpointing but new identical words can', () => {
    const result = turns('deepgram');
    const event = (start, final) => ({ type: 'Results', start, duration: 1, is_final: final, speech_final: final, channel: { alternatives: [{ transcript: 'Again' }] } });
    result.controller.event(event(0, true));
    result.controller.activity(true); result.controller.activity(false);
    result.controller.event(event(0, false)); result.controller.event(event(0, true));
    assert.equal(result.starts, 1); assert.deepEqual(result.turns, ['Again']);
    result.controller.event(event(1, false)); result.controller.event(event(1, true));
    assert.equal(result.starts, 2); assert.deepEqual(result.turns, ['Again', 'Again']); result.controller.dispose();
});

test('a delayed Deepgram endpoint cannot prematurely submit a newer utterance', () => {
    const result = turns('deepgram');
    const event = (start, text, end) => ({ type: 'Results', start, duration: 1, is_final: true, speech_final: end, channel: { alternatives: [{ transcript: text }] } });
    result.controller.event(event(0, 'First', true));
    result.controller.event(event(2, 'Second', false));
    result.controller.event({ type: 'UtteranceEnd', last_word_end: 1 });
    assert.deepEqual(result.turns, ['First']);
    result.controller.event(event(3, 'question', true));
    assert.deepEqual(result.turns, ['First', 'Second question']); result.controller.dispose();
});

test('Soniox old timed tokens never interrupt or duplicate words after submission', () => {
    const result = turns('soniox');
    const token = (start, end, text, final = true) => ({ start_ms: start, end_ms: end, text, is_final: final });
    const first = { tokens: [token(0, 1000, 'Again'), { text: '<end>', is_final: true }] };
    result.controller.event(first); result.controller.activity(true); result.controller.activity(false);
    result.controller.event({ tokens: [token(0, 1000, 'Again', false)] }); result.controller.event(first);
    assert.equal(result.starts, 1); assert.deepEqual(result.turns, ['Again']);
    result.controller.event({ tokens: [token(1000, 2000, 'Again'), { text: '<end>', is_final: true }] });
    assert.equal(result.starts, 2); assert.deepEqual(result.turns, ['Again', 'Again']); result.controller.dispose();
});

test('ElevenLabs paired and repeated commits are deduplicated without a time window; fresh activity allows repeated words', () => {
    const result = turns('elevenlabs');
    result.controller.event({ message_type: 'committed_transcript', text: 'Again' });
    for (let i = 0; i < 3; i++) {
        result.controller.event({ message_type: 'partial_transcript', text: 'Again' });
        result.controller.event({ message_type: 'committed_transcript_with_timestamps', text: 'Again' });
        result.controller.event({ message_type: 'committed_transcript', text: 'Again' });
    }
    assert.equal(result.starts, 1); assert.deepEqual(result.turns, ['Again']);
    result.controller.activity(true); result.controller.activity(false);
    result.controller.event({ message_type: 'committed_transcript', text: 'Again' });
    assert.equal(result.starts, 2); assert.deepEqual(result.turns, ['Again', 'Again']); result.controller.dispose();
});

test('AssemblyAI formatted final does not submit a duplicate turn', () => {
    const result = turns('assemblyai');
    result.controller.event({ type: 'Turn', turn_order: 0, end_of_turn: false, transcript: 'hello' });
    result.controller.event({ type: 'Turn', turn_order: 0, end_of_turn: true, transcript: 'Hello' });
    result.controller.event({ type: 'Turn', turn_order: 0, end_of_turn: true, turn_is_formatted: true, transcript: 'Hello.' });
    assert.deepEqual(result.turns, ['Hello']); result.controller.dispose();
});

test('ElevenLabs accepts timestamp-only commits and deduplicates paired commit variants', () => {
    const result = turns('elevenlabs');
    result.controller.event({ message_type: 'committed_transcript_with_timestamps', text: 'Hello' });
    result.controller.event({ message_type: 'committed_transcript', text: 'Hello' });
    assert.deepEqual(result.turns, ['Hello']); result.controller.dispose();
});

test('Gladia final utterances and Cartesia auto turns use their final text', () => {
    const gladia = turns('gladia');
    const event = { type: 'transcript', data: { id: 'one', is_final: true, utterance: { text: 'Hello', start: 0, end: 1 } } };
    gladia.controller.event(event); gladia.controller.event(event);
    assert.deepEqual(gladia.turns, ['Hello']); gladia.controller.dispose();
    const cartesia = turns('cartesia');
    cartesia.controller.event({ type: 'turn.start' });
    cartesia.controller.event({ type: 'turn.eager_end', transcript: 'Wrong preview' });
    assert.deepEqual(cartesia.turns, []);
    cartesia.controller.event({ type: 'turn.end', transcript: 'Final text' });
    assert.deepEqual(cartesia.turns, ['Final text']); cartesia.controller.dispose();
});

test('Soniox token batches preserve mid-word boundaries and submit on endpoint markers', () => {
    const result = turns('soniox');
    result.controller.event({ tokens: [{ is_final: true, text: 'Hel' }] });
    result.controller.event({ tokens: [{ is_final: true, text: 'lo world' }, { is_final: true, text: '<end>' }] });
    assert.deepEqual(result.turns, ['Hello world']); result.controller.dispose();
});

test('Google final transcription supersedes interim text and waits for turnComplete', () => {
    const result = turns('google');
    result.controller.event({ serverContent: { interimInputTranscription: { text: 'preview' } } });
    result.controller.event({ serverContent: { inputTranscription: { text: 'Final text' }, turnComplete: true } });
    assert.deepEqual(result.turns, ['Final text']); result.controller.dispose();
});

test('fallback turn timer is cancelled on disposal and never submits interim-only text', async () => {
    const result = turns('cartesia');
    result.controller.event({ type: 'transcript', is_final: false, text: 'interim' });
    await sleep(950); assert.deepEqual(result.turns, []);
    result.controller.event({ type: 'transcript', is_final: true, text: 'final' });
    result.controller.dispose(); await sleep(950); assert.deepEqual(result.turns, []);
});

test('completed intermediate text is spoken before a later tool call, not at turn finish', () => {
    const spoken = [];
    const observer = new CompletedAgentText((key, text) => spoken.push([key, text]));
    observer.handle({ type: 'text-start', id: 'before-tools' });
    observer.handle({ type: 'text-delta', id: 'before-tools', delta: 'Let me check.' });
    assert.deepEqual(spoken, []);
    observer.handle({ type: 'text-end', id: 'before-tools' });
    assert.deepEqual(spoken, [['before-tools', 'Let me check.']]);
    observer.handle({ type: 'tool-input-available', toolName: 'search' });
    observer.handle({ type: 'reasoning-delta', id: 'reasoning', delta: 'private' });
    observer.handle({ type: 'text-end', id: 'before-tools' });
    observer.finish({ id: 'answer', parts: [{ type: 'text', text: 'Let me check.' }] });
    assert.equal(spoken.length, 1);
});

test('older transports speak only final completed assistant text, never reasoning', () => {
    const spoken = [];
    new CompletedAgentText((key, text) => spoken.push(text)).finish({ id: 'one', parts: [
        { type: 'text', text: 'Answer' }, { type: 'reasoning', text: 'private' }, { type: 'tool-search', output: 'tool result' },
    ] });
    assert.deepEqual(spoken, ['Answer']);
});

test('speech is ordered, deduplicated, and cancellation clears current and queued audio', async () => {
    const played = [], errors = [];
    const queue = new AgentSpeechQueue(async (text, signal) => {
        played.push(text);
        if (text === 'one') await new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('cancelled', 'AbortError')), { once: true }));
    }, error => errors.push(error));
    queue.enqueue('a', 'one'); queue.enqueue('a', 'one'); queue.enqueue('b', 'two');
    await sleep(0); assert.deepEqual(played, ['one']);
    queue.clear(); queue.enqueue('c', 'new turn'); await sleep(0);
    assert.deepEqual(played, ['one', 'new turn']); assert.deepEqual(errors, []);
    queue.clear();
});

test('a failed speech item does not poison later queued messages', async () => {
    const played = [], errors = [];
    const queue = new AgentSpeechQueue(async text => { played.push(text); if (text === 'bad') throw new Error('failed'); }, error => errors.push(error));
    queue.enqueue('a', 'bad'); queue.enqueue('b', 'next'); await sleep(0);
    assert.deepEqual(played, ['bad', 'next']); assert.equal(errors.length, 1); queue.clear();
});

function sse(parts) {
    return new Response(parts.map(part => `data: ${typeof part === 'string' ? part : JSON.stringify(part)}\n\n`).join(''),
        { headers: { 'content-type': 'text/event-stream' } });
}
test('new speech stream sends ordered text parts and receives typed audio/finish events', async () => {
    let body; const audio = [];
    await streamSpeech({ url: '/api/speech/stream', model: 'openai/tts', text: 'Hello', providerOptions: { openai: { voice: 'cedar' } },
        signal: new AbortController().signal, fetch: async (_, init) => {
            body = JSON.parse(init.body);
            return sse([{ type: 'audio', audio: 'AQI=', audioFormat: { type: 'audio/pcm', rate: 16000 } }, { type: 'finish' }, '[DONE]']);
        }, onAudio: part => audio.push(part),
    });
    assert.deepEqual(body.text, [{ type: 'text', text: 'Hello' }]);
    assert.equal(Object.hasOwn(body, 'outputFormat'), false, 'provider-default output must not be overridden');
    assert.equal(body.providerOptions.openai.voice, 'cedar'); assert.equal(audio[0].audioFormat.rate, 16000);
});

test('truncated streams and SSE errors fail even with HTTP 200', async () => {
    const args = { url: '/api/speech/stream', model: 'p/m', text: 'Hi', signal: new AbortController().signal, onAudio() {} };
    await assert.rejects(streamSpeech({ ...args, fetch: async () => sse([{ type: 'audio', audio: 'AA==', audioFormat: { type: 'audio/mpeg' } }]) }), /finish/);
    await assert.rejects(streamSpeech({ ...args, fetch: async () => sse([{ type: 'error', error: 'unsupported' }]) }), /unsupported/);
});

test('speech fallback is silent only for unsupported streaming, preserves model options, and is abort-aware', async t => {
    const calls = [];
    const { AgentAudioOutput } = load(root + 'realtime/agentSpeechPlayback.ts', {
        'aihappey-ai': { SpeechStreamingUnsupportedError, streamSpeech: async () => { throw new SpeechStreamingUnsupportedError(); }, base64ToUint8Array: () => new Uint8Array([1, 2]) },
    });
    const originalAudio = globalThis.Audio;
    globalThis.Audio = class { pause() {} removeAttribute() {} load() {} };
    t.after(() => { if (originalAudio === undefined) delete globalThis.Audio; else globalThis.Audio = originalAudio; });
    const output = new AgentAudioOutput(); output.playBytes = async (...args) => calls.push(args);
    await output.speak({ baseUrl: 'https://api.example', endpoints: { speech: '/api/speech' }, fetch: async (url, init) => {
        calls.push([url, JSON.parse(init.body)]); return Response.json({ audio: { base64: 'AQI=', mimeType: 'audio/mpeg' } });
    } }, {}, { id: 'openai/tts', providerMetadata: { openai: { voice: 'cedar' }, unrelated: { secret: true } } }, 'Hello', new AbortController().signal);
    assert.equal(calls[0][0], 'https://api.example/api/speech');
    assert.deepEqual(calls[0][1].providerOptions, { openai: { voice: 'cedar' } });
    assert.equal(calls.length, 2);
    const abort = new AbortController(); abort.abort();
    await assert.rejects(output.speak({}, {}, { id: 'openai/tts' }, 'Hello', abort.signal), { name: 'AbortError' });
    assert.equal(calls.length, 2);
});

test('only explicit streaming capability failures are eligible for non-streaming fallback', async () => {
    const args = { url: '/api/speech/stream', model: 'google/tts', text: 'Hi', signal: new AbortController().signal, onAudio() {} };
    for (const status of [404, 405, 501]) {
        await assert.rejects(streamSpeech({ ...args, fetch: async () => new Response('unavailable', { status }) }), SpeechStreamingUnsupportedError);
    }
    for (const status of [400, 401, 403, 429, 500, 503]) {
        await assert.rejects(streamSpeech({ ...args, fetch: async () => new Response('failed', { status }) }),
            error => !(error instanceof SpeechStreamingUnsupportedError));
    }
    const unsupported = { type: 'error', error: "Provider 'example' does not support Vercel speech streaming yet." };
    await assert.rejects(streamSpeech({ ...args, fetch: async () => sse([unsupported]) }), SpeechStreamingUnsupportedError);
    const audio = { type: 'audio', audio: 'AQI=', audioFormat: { type: 'audio/mp3', rate: 44100 } };
    await assert.rejects(streamSpeech({ ...args, fetch: async () => sse([audio, unsupported]) }),
        error => !(error instanceof SpeechStreamingUnsupportedError));
    await assert.rejects(streamSpeech({ ...args, fetch: async () => sse([{ type: 'error', error: "Google speech output format 'bad' is not supported." }]) }),
        error => !(error instanceof SpeechStreamingUnsupportedError));
    const failure = new Error('decoder failed');
    await assert.rejects(streamSpeech({ ...args, fetch: async () => sse([audio, { type: 'finish' }]), onAudio() { throw failure; } }),
        error => error === failure);
});

// Exercise the actual SSE reader and playback state machine without native codecs.
// These mocks test ordering/capability decisions, not the decodability of Google's real audio bytes.
function speechPlaybackHarness(t, options = {}) {
    const state = { calls: [], supportedTypes: [], bufferTypes: [], appended: [], plays: 0, revoked: [], warnings: [], pcmBuffers: [], pcmSources: [] };
    const originalAudio = globalThis.Audio, originalSource = globalThis.MediaSource;
    class Audio {
        ended = false; error = null;
        constructor() { state.audio = this; }
        pause() { state.paused = true; }
        removeAttribute() {}
        load() {}
        async play() {
            state.plays++;
            if (options.playError) throw options.playError;
        }
    }
    class SourceBuffer extends EventTarget {
        updating = false;
        appendBuffer(value) {
            if (options.appendError) throw options.appendError;
            state.appended.push([...new Uint8Array(value)]);
            this.updating = true;
            queueMicrotask(() => { this.updating = false; this.dispatchEvent(new Event('updateend')); });
        }
    }
    class MediaSource extends EventTarget {
        readyState = 'closed';
        static isTypeSupported(type) { state.supportedTypes.push(type); return options.supported !== false && type === 'audio/mpeg'; }
        constructor() {
            super();
            queueMicrotask(() => { this.readyState = 'open'; this.dispatchEvent(new Event('sourceopen')); });
        }
        addSourceBuffer(type) { state.bufferTypes.push(type); return new SourceBuffer(); }
        endOfStream() { this.readyState = 'ended'; if (!options.playError) state.audio.ended = true; }
    }
    globalThis.Audio = Audio; globalThis.MediaSource = MediaSource;
    t.after(() => {
        if (originalAudio === undefined) delete globalThis.Audio; else globalThis.Audio = originalAudio;
        if (originalSource === undefined) delete globalThis.MediaSource; else globalThis.MediaSource = originalSource;
    });
    t.mock.method(URL, 'createObjectURL', () => 'blob:speech-test');
    t.mock.method(URL, 'revokeObjectURL', value => state.revoked.push(value));
    t.mock.method(console, 'warn', (...args) => state.warnings.push(args));
    const { AgentAudioOutput } = load(root + 'realtime/agentSpeechPlayback.ts', {
        'aihappey-ai': { streamSpeech, SpeechStreamingUnsupportedError,
            base64ToUint8Array: value => new Uint8Array(Buffer.from(value, 'base64')),
            concatUint8Arrays: chunks => new Uint8Array(Buffer.concat(chunks)),
        },
    });
    state.output = new AgentAudioOutput();
    state.context = { currentTime: 0, state: 'running', destination: {}, resume: async () => {},
        createBuffer(channels, count, sampleRate) {
            const samples = new Float32Array(count);
            const buffer = { channels, sampleRate, duration: count / sampleRate, getChannelData: () => samples };
            state.pcmBuffers.push(buffer); return buffer;
        },
        createBufferSource() {
            const source = { connect() {}, disconnect() { this.disconnected = true; },
                start(at) { this.at = at; if (options.autoEndPcm !== false) queueMicrotask(() => this.onended?.()); },
                stop() { this.stopped = true; },
            };
            state.pcmSources.push(source); return source;
        },
        decodeAudioData() { assert.fail('Raw PCM must not reach the encoded-audio decoder'); },
    };
    Object.defineProperty(state.output, 'audioContext', { get: () => state.context });
    state.signal = new AbortController();
    state.speak = () => state.output.speak({ baseUrl: 'https://api.example', endpoints: { speech: '/api/speech' }, fetch: async (url, init) => {
        state.calls.push([url, JSON.parse(init.body)]);
        return options.response ?? sse([
            { type: 'audio', audio: 'AQI=', audioFormat: { type: 'audio/mp3', rate: 24000 } },
            { type: 'audio', audio: 'AwQ=', audioFormat: { type: 'audio/mpeg', rate: 44100 } },
            { type: 'finish' }, '[DONE]',
        ]);
    } }, {}, { id: options.model ?? 'google/tts' }, 'Private speech text', state.signal.signal);
    return state;
}

test('Google MP3 aliases and corrected encoded sample rates use incremental browser playback without re-synthesis', async t => {
    const state = speechPlaybackHarness(t);
    await state.speak();
    assert.equal(state.calls.length, 1);
    assert.equal(state.calls[0][0], 'https://api.example/api/speech/stream');
    assert.equal(Object.hasOwn(state.calls[0][1], 'outputFormat'), false);
    assert.deepEqual(state.supportedTypes, ['audio/mpeg']);
    assert.deepEqual(state.bufferTypes, ['audio/mpeg']);
    assert.deepEqual(state.appended, [[1, 2], [3, 4]]);
    assert.equal(state.plays, 1);
    assert.deepEqual(state.revoked, ['blob:speech-test']);
    assert.equal(state.warnings.length, 0);
});

test('MP3 playback starts while the SSE response is still waiting for its finish event', async t => {
    let finish;
    const response = new Response(new ReadableStream({ start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('data: {"type":"audio","audio":"AQI=","audioFormat":{"type":"audio/mp3","rate":44100}}\n\n'));
        finish = () => { controller.enqueue(encoder.encode('data: {"type":"finish"}\n\ndata: [DONE]\n\n')); controller.close(); };
    } }), { headers: { 'content-type': 'text/event-stream' } });
    const state = speechPlaybackHarness(t, { response });
    const speaking = state.speak();
    try {
        await sleep(0);
        assert.equal(state.plays, 1);
    } finally { finish(); await speaking; }
    assert.equal(state.calls.length, 1);
});

for (const kind of ['playError', 'appendError']) test(`${kind} preserves its cause and diagnostics without requesting speech again`, async t => {
    const failure = new DOMException('Browser playback failed', kind === 'playError' ? 'NotAllowedError' : 'EncodingError');
    const state = speechPlaybackHarness(t, { [kind]: failure });
    await assert.rejects(state.speak(), error => error.cause === failure &&
        error.message.includes(kind === 'playError' ? 'media-element-play' : 'media-source-append'));
    assert.equal(state.calls.length, 1);
    assert.equal(state.warnings.length, 1);
    const diagnostic = state.warnings[0][1];
    assert.equal(diagnostic.receivedAudio, true);
    assert.equal(diagnostic.bytes, 4);
    assert.equal(diagnostic.errorName, failure.name);
    assert.equal(JSON.stringify(state.warnings).includes('Private speech text'), false);
    assert.deepEqual(state.revoked, ['blob:speech-test']);
});

test('browsers without MPEG MediaSource support decode the received bytes instead of re-synthesizing', async t => {
    const state = speechPlaybackHarness(t, { supported: false });
    const decoded = [];
    state.output.playBytes = async (bytes, format) => decoded.push({ bytes: [...bytes], format });
    await state.speak();
    assert.equal(state.calls.length, 1);
    assert.deepEqual(decoded, [{ bytes: [1, 2, 3, 4], format: { type: 'audio/mpeg', rate: 24000 } }]);
    assert.equal(state.plays, 0);
});

test('buffered decode failure is surfaced, not silently replaced by a new synthesis', async t => {
    const state = speechPlaybackHarness(t, { supported: false });
    const failure = new DOMException('Unable to decode audio data', 'EncodingError');
    state.output.playBytes = async () => { throw failure; };
    await assert.rejects(state.speak(), error => error.cause === failure && /buffered-decode\/playback/.test(error.message));
    assert.equal(state.calls.length, 1);
});

test('aborting streamed playback cleans up without diagnostics or non-streaming fallback', async t => {
    const state = speechPlaybackHarness(t, { supported: false });
    state.output.playBytes = async () => { state.signal.abort(); state.signal.signal.throwIfAborted(); };
    await assert.rejects(state.speak(), { name: 'AbortError' });
    assert.equal(state.calls.length, 1);
    assert.equal(state.warnings.length, 0);
    assert.equal(state.paused, true);
});

const pcmPart = (bytes, format = { type: 'audio/l16', rate: 24000 }, channels = 1) => ({
    type: 'audio', audio: Buffer.from(bytes).toString('base64'), audioFormat: format,
    providerMetadata: { google: { mime_type: format.type, channels, sample_rate: format.rate } },
});

for (const rate of [16000, 24000, 48000]) test(`Google L16 plays little-endian samples at the reported ${rate} Hz across split chunks`, async t => {
    const format = { type: 'audio/l16', rate };
    const state = speechPlaybackHarness(t, { response: sse([
        pcmPart([0], format), pcmPart([128, 255, 127], format), pcmPart([0, 0, 0, 64], format), { type: 'finish' }, '[DONE]',
    ]) });
    await state.speak();
    assert.equal(state.calls.length, 1);
    assert.deepEqual(state.supportedTypes, [], 'raw PCM must bypass MediaSource');
    assert.equal(state.plays, 0);
    assert.deepEqual(state.pcmBuffers.map(buffer => buffer.sampleRate), [rate, rate]);
    assert.deepEqual([...state.pcmBuffers[0].getChannelData()], [-1, 32767 / 32768]);
    assert.deepEqual([...state.pcmBuffers[1].getChannelData()], [0, 0.5]);
    assert.equal(state.pcmSources[0].at, 0.08, 'startup buffer absorbs delivery jitter');
    assert.equal(state.pcmSources[1].at, state.pcmSources[0].at + state.pcmBuffers[0].duration);
    assert.equal(state.warnings.length, 0);
});

test('PCM is scheduled before the stream finishes, and speech waits until scheduled audio ends', async t => {
    let finish;
    const response = new Response(new ReadableStream({ start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(pcmPart([0, 128, 255, 127]))}\n\n`));
        finish = () => { controller.enqueue(encoder.encode('data: {"type":"finish"}\n\ndata: [DONE]\n\n')); controller.close(); };
    } }), { headers: { 'content-type': 'text/event-stream' } });
    const state = speechPlaybackHarness(t, { response, autoEndPcm: false });
    let completed = false;
    const speaking = state.speak().then(() => { completed = true; });
    try {
        await sleep(0);
        assert.equal(state.pcmSources.length, 1, 'PCM schedules while more SSE audio may still arrive');
        assert.equal(completed, false);
        finish(); finish = undefined;
        await sleep(0);
        assert.equal(completed, false, 'a finish event is not the end of audible playback');
        for (const source of state.pcmSources) source.onended?.();
        await speaking;
        assert.equal(completed, true);
        assert.equal(state.calls.length, 1);
    } finally {
        if (finish) finish();
        state.signal.abort(); await speaking.catch(() => {});
    }
});

test('standard non-Google L16 retains big-endian byte order instead of inheriting Google semantics', async t => {
    const state = speechPlaybackHarness(t, { model: 'example/tts', response: sse([
        pcmPart([128, 0, 127, 255]), { type: 'finish' }, '[DONE]',
    ]) });
    await state.speak();
    assert.deepEqual([...state.pcmBuffers[0].getChannelData()], [-1, 32767 / 32768]);
});

for (const type of ['audio/pcm', 'audio/pcm_s16le', 'audio/L16;rate=16000;channels=1']) test(`${type} uses the PCM scheduler`, async t => {
    const state = speechPlaybackHarness(t, { response: sse([
        pcmPart([0, 128], type.includes(';') ? { type } : { type, rate: 16000 }), { type: 'finish' }, '[DONE]',
    ]) });
    await state.speak();
    assert.equal(state.pcmBuffers[0].sampleRate, 16000);
    assert.deepEqual([...state.pcmBuffers[0].getChannelData()], [-1]);
});

for (const [name, parts, message] of [
    ['missing rate', [pcmPart([0, 0], { type: 'audio/l16' })], /positive sample rate/],
    ['invalid rate', [pcmPart([0, 0], { type: 'audio/l16', rate: 0 })], /positive sample rate/],
    ['stereo', [pcmPart([0, 0], undefined, 2)], /mono audio/],
    ['incomplete sample', [pcmPart([0])], /incomplete PCM sample/],
    ['changed rate', [pcmPart([0, 0]), pcmPart([0, 0], { type: 'audio/l16', rate: 16000 })], /format changed/],
]) test(`invalid PCM ${name} reports a failure without a new synthesis request`, async t => {
    const state = speechPlaybackHarness(t, { response: sse([...parts, { type: 'finish' }, '[DONE]']) });
    await assert.rejects(state.speak(), message);
    assert.equal(state.calls.length, 1);
    assert.equal(state.warnings.length, 1);
    assert.equal(state.pcmSources.every(source => source.disconnected), true);
});

test('cancelling while PCM drains stops every scheduled source without fallback', async t => {
    const state = speechPlaybackHarness(t, { autoEndPcm: false, response: sse([
        pcmPart([0, 0]), pcmPart([1, 0]), { type: 'finish' }, '[DONE]',
    ]) });
    const speaking = state.speak();
    await sleep(0);
    assert.equal(state.pcmSources.length, 2);
    state.signal.abort();
    await assert.rejects(speaking, { name: 'AbortError' });
    assert.equal(state.pcmSources.every(source => source.stopped && source.disconnected), true);
    assert.equal(state.calls.length, 1);
    assert.equal(state.warnings.length, 0);
});

test('editor uses draft-only settings and the page retains the native controller and explicit agent target', () => {
    const editor = fs.readFileSync(root + 'agents/AgentForm.tsx', 'utf8');
    const page = fs.readFileSync(root + 'realtime/RealtimePage.tsx', 'utf8');
    assert.match(editor, /AgentRealtimeSettings/); assert.match(editor, /AudioProviderSettings/);
    assert.match(page, /useController = useRealtimeConversationController/);
    assert.match(page, /\?agent=\$\{encodeURIComponent\(agentKey\)\}/);
    assert.match(page, /if \(!entry\) return/);
    assert.match(page, /!historyLoaded/);
});
